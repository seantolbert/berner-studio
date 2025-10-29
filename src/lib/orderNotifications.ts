import { formatCurrencyCents } from "@/lib/money";
import {
  getOrderNotificationEmails,
  getOrderNotificationSmsNumbers,
  hasEmailTransport,
  hasSmsTransport,
} from "@/lib/env";
import { sendEmail, EmailNotConfiguredError } from "@/lib/email";
import { sendSms, SmsNotConfiguredError } from "@/lib/sms";
import type { OrderRecord } from "@/lib/orders";
import { markOrderNotified } from "@/lib/orders";
import type { CheckoutAddress, CheckoutContact, CheckoutDraftMetadata } from "@/types/checkout";

type NotificationResult = {
  merchant: boolean;
  customer: boolean;
};

export async function notifyOrderPaid(order: OrderRecord): Promise<NotificationResult> {
  const [merchantNotified, customerNotified] = await Promise.all([
    notifyMerchant(order),
    notifyCustomer(order),
  ]);

  const updates: { merchant?: boolean; customer?: boolean } = {};
  if (merchantNotified) updates.merchant = true;
  if (customerNotified) updates.customer = true;
  if (Object.keys(updates).length) {
    await markOrderNotified(order.id, updates).catch((err) => {
      console.error("[notifyOrderPaid] Failed to mark notification timestamps", { orderId: order.id, err });
    });
  }

  return { merchant: merchantNotified, customer: customerNotified };
}

async function notifyMerchant(order: OrderRecord): Promise<boolean> {
  if (order.merchant_notified_at) return false;

  const emailRecipients = getOrderNotificationEmails();
  const smsRecipients = getOrderNotificationSmsNumbers();

  const summary = buildOrderSummary(order);

  let emailSent = false;
  if (emailRecipients.length && hasEmailTransport()) {
    try {
      await sendEmail({
        to: emailRecipients,
        subject: `New order: ${summary.total} from ${summary.customerName}`,
        text: buildMerchantEmailText(summary),
        html: buildMerchantEmailHtml(summary),
      });
      emailSent = true;
    } catch (error) {
      if (error instanceof EmailNotConfiguredError) {
        console.warn("[notifyMerchant] Email transport not configured; skipping merchant email");
      } else {
        console.error("[notifyMerchant] Failed to send merchant email notification", { orderId: order.id, error });
      }
    }
  }

  let smsSent = false;
  if (smsRecipients.length && hasSmsTransport()) {
    const smsBody = buildMerchantSms(summary);
    await Promise.all(
      smsRecipients.map(async (phone) => {
        try {
          await sendSms({ to: phone, body: smsBody });
          smsSent = true;
        } catch (error) {
          if (error instanceof SmsNotConfiguredError) {
            console.warn("[notifyMerchant] SMS transport not configured; skipping merchant SMS");
          } else {
            console.error("[notifyMerchant] Failed to send merchant SMS notification", {
              orderId: order.id,
              phone,
              error,
            });
          }
        }
      })
    );
  }

  return emailSent || smsSent;
}

async function notifyCustomer(order: OrderRecord): Promise<boolean> {
  if (order.customer_notified_at) return false;
  const to = order.email?.trim() || extractContactEmail(order.metadata);
  if (!to) return false;
  if (!hasEmailTransport()) return false;

  const summary = buildOrderSummary(order);

  try {
    await sendEmail({
      to: [to],
      subject: `Thanks for your order! (${summary.orderShortId})`,
      text: buildCustomerEmailText(summary),
      html: buildCustomerEmailHtml(summary),
    });
    return true;
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) {
      console.warn("[notifyCustomer] Email transport not configured; skipping customer email");
    } else {
      console.error("[notifyCustomer] Failed to send customer email notification", { orderId: order.id, error });
    }
    return false;
  }
}

type OrderSummary = {
  orderId: string;
  orderShortId: string;
  createdAt: string;
  total: string;
  totalValue: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  captureMethod: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[];
  metadata: CheckoutDraftMetadata | null;
  shippingAddressLines: string[];
  billingAddressLines: string[];
  notes?: string | null;
  stripePaymentIntentId?: string | null;
};

function buildOrderSummary(order: OrderRecord): OrderSummary {
  const metadata = order.metadata ?? null;
  const contact: CheckoutContact | null =
    metadata?.contact && typeof metadata.contact === "object" ? metadata.contact : null;
  const shippingAddress: CheckoutAddress | null =
    metadata?.shippingAddress && typeof metadata.shippingAddress === "object"
      ? metadata.shippingAddress
      : null;
  const billingAddress: CheckoutAddress | null =
    metadata?.billingAddress && typeof metadata.billingAddress === "object"
      ? metadata.billingAddress
      : null;

  const customerName = (contact?.fullName ?? "").trim();
  const customerEmail = (order.email ?? contact?.email ?? "").trim();
  const customerPhone = (contact?.phone ?? "").trim();

  const items = Array.isArray(order.items)
    ? order.items.map((item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return {
          name: item.name,
          quantity,
          unitPrice: formatCurrencyCents(unitPrice, order.currency),
          lineTotal: formatCurrencyCents(unitPrice * quantity, order.currency),
        };
      })
    : [];

  return {
    orderId: order.id,
    orderShortId: `${order.id.slice(0, 8)}…`,
    createdAt: order.created_at,
    total: formatCurrencyCents(order.amount_cents, order.currency),
    totalValue: order.amount_cents,
    currency: order.currency,
    customerName: customerName || customerEmail || "Customer",
    customerEmail,
    customerPhone,
    captureMethod: order.capture_method,
    items,
    metadata,
    shippingAddressLines: formatAddress(shippingAddress),
    billingAddressLines: formatAddress(billingAddress),
    notes: metadata?.notes ?? null,
    stripePaymentIntentId: order.stripe_payment_intent_id,
  };
}

function buildMerchantEmailText(summary: OrderSummary) {
  const lines: string[] = [];
  lines.push(`You have a new order: ${summary.total}.`);
  lines.push("");
  lines.push(`Order ID: ${summary.orderId}`);
  lines.push(`Placed: ${new Date(summary.createdAt).toLocaleString()}`);
  lines.push(`Capture method: ${summary.captureMethod}`);
  lines.push(`Customer: ${summary.customerName}`);
  lines.push(`Email: ${summary.customerEmail || "—"}`);
  lines.push(`Phone: ${summary.customerPhone || "—"}`);
  if (summary.metadata?.shippingMethod) {
    lines.push(`Shipping method: ${summary.metadata.shippingMethod}`);
  }
  lines.push("");
  lines.push("Items:");
  summary.items.forEach((item) => {
    lines.push(`• ${item.quantity} × ${item.name} — ${item.lineTotal} (${item.unitPrice} ea)`);
  });
  lines.push("");
  if (summary.shippingAddressLines.length) {
    lines.push("Ship to:");
    summary.shippingAddressLines.forEach((line) => lines.push(`  ${line}`));
    lines.push("");
  }
  if (summary.billingAddressLines.length) {
    lines.push("Billing address:");
    summary.billingAddressLines.forEach((line) => lines.push(`  ${line}`));
    lines.push("");
  }
  if (summary.notes) {
    lines.push("Customer notes:");
    lines.push(`  ${summary.notes}`);
    lines.push("");
  }
  if (summary.stripePaymentIntentId) {
    lines.push(`Stripe PI: ${summary.stripePaymentIntentId}`);
  }
  return lines.join("\n");
}

function buildMerchantEmailHtml(summary: OrderSummary) {
  const itemsHtml = summary.items
    .map(
      (item) =>
        `<li>${escapeHtml(String(item.quantity))} × ${escapeHtml(item.name)} — ${escapeHtml(item.lineTotal)} <span style="color:#555">(${escapeHtml(item.unitPrice)} ea)</span></li>`
    )
    .join("");
  const shipToHtml = summary.shippingAddressLines
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  const billingHtml = summary.billingAddressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");

  return `
    <div>
      <p>You have a new order: <strong>${escapeHtml(summary.total)}</strong>.</p>
      <p>
        <strong>Order ID:</strong> ${escapeHtml(summary.orderId)}<br />
        <strong>Placed:</strong> ${escapeHtml(new Date(summary.createdAt).toLocaleString())}<br />
        <strong>Capture method:</strong> ${escapeHtml(summary.captureMethod)}<br />
        <strong>Customer:</strong> ${escapeHtml(summary.customerName)}<br />
        <strong>Email:</strong> ${escapeHtml(summary.customerEmail || "—")}<br />
        <strong>Phone:</strong> ${escapeHtml(summary.customerPhone || "—")}<br />
        ${
          summary.metadata?.shippingMethod
            ? `<strong>Shipping method:</strong> ${escapeHtml(summary.metadata.shippingMethod)}<br />`
            : ""
        }
        ${
          summary.stripePaymentIntentId
            ? `<strong>Stripe PI:</strong> ${escapeHtml(summary.stripePaymentIntentId)}<br />`
            : ""
        }
      </p>
      <p><strong>Items:</strong></p>
      <ul>${itemsHtml}</ul>
      ${
        shipToHtml
          ? `<p><strong>Ship to:</strong><br />${shipToHtml}</p>`
          : ""
      }
      ${
        billingHtml
          ? `<p><strong>Billing address:</strong><br />${billingHtml}</p>`
          : ""
      }
      ${
        summary.notes
          ? `<p><strong>Customer notes:</strong><br />${escapeHtml(summary.notes).replace(/\n/g, "<br />")}</p>`
          : ""
      }
    </div>
  `;
}

function buildMerchantSms(summary: OrderSummary) {
  const primaryItem = summary.items[0];
  const additionalCount = Math.max(0, summary.items.length - 1);
  const itemPart = primaryItem
    ? `${primaryItem.quantity}× ${primaryItem.name}${additionalCount ? ` (+${additionalCount} more)` : ""}`
    : "Items available in admin";
  return `New order ${summary.total} from ${summary.customerName}. ${itemPart}. Order ${summary.orderShortId}.`;
}

function buildCustomerEmailText(summary: OrderSummary) {
  const lines: string[] = [];
  lines.push(`Hi ${summary.customerName},`);
  lines.push("");
  lines.push(`Thanks for your order! We received your payment of ${summary.total}.`);
  if (summary.metadata?.shippingMethod) {
    lines.push(`Shipping method: ${summary.metadata.shippingMethod}`);
  }
  lines.push("");
  lines.push("Order summary:");
  summary.items.forEach((item) => {
    lines.push(`• ${item.quantity} × ${item.name} — ${item.lineTotal}`);
  });
  lines.push("");
  if (summary.shippingAddressLines.length) {
    lines.push("Shipping to:");
    summary.shippingAddressLines.forEach((line) => lines.push(`  ${line}`));
    lines.push("");
  }
  if (summary.notes) {
    lines.push("Your notes:");
    lines.push(`  ${summary.notes}`);
    lines.push("");
  }
  lines.push(`Order ID: ${summary.orderId}`);
  lines.push("We’ll follow up with tracking details as soon as your order ships.");
  lines.push("");
  lines.push("— The BSFront Team");
  return lines.join("\n");
}

function buildCustomerEmailHtml(summary: OrderSummary) {
  const itemsHtml = summary.items
    .map(
      (item) =>
        `<li>${escapeHtml(String(item.quantity))} × ${escapeHtml(item.name)} — ${escapeHtml(item.lineTotal)}</li>`
    )
    .join("");
  const shipToHtml = summary.shippingAddressLines
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");

  return `
    <div>
      <p>Hi ${escapeHtml(summary.customerName)},</p>
      <p>Thanks for your order! We received your payment of <strong>${escapeHtml(summary.total)}</strong>.</p>
      ${
        summary.metadata?.shippingMethod
          ? `<p><strong>Shipping method:</strong> ${escapeHtml(summary.metadata.shippingMethod)}</p>`
          : ""
      }
      <p><strong>Order summary:</strong></p>
      <ul>${itemsHtml}</ul>
      ${
        shipToHtml
          ? `<p><strong>Shipping to:</strong><br />${shipToHtml}</p>`
          : ""
      }
      ${
        summary.notes
          ? `<p><strong>Your notes:</strong><br />${escapeHtml(summary.notes).replace(/\n/g, "<br />")}</p>`
          : ""
      }
      <p><strong>Order ID:</strong> ${escapeHtml(summary.orderId)}</p>
      <p>We’ll follow up with tracking details as soon as your order ships.</p>
      <p>— The BSFront Team</p>
    </div>
  `;
}

function formatAddress(address: CheckoutAddress | null | undefined): string[] {
  if (!address) return [];
  const lines: string[] = [];
  const line1 = (address.line1 ?? "").trim();
  const line2 = (address.line2 ?? "").trim();
  const city = (address.city ?? "").trim();
  const state = (address.state ?? "").trim();
  const postalCode = (address.postalCode ?? "").trim();
  const country = (address.country ?? "").trim();

  if (line1) lines.push(line1);
  if (line2) lines.push(line2);

  const cityState = [city, state].filter(Boolean).join(", ");
  const cityLine = postalCode ? [cityState, postalCode].filter(Boolean).join(" ") : cityState;
  if (cityLine) lines.push(cityLine);
  if (country) lines.push(country);

  return lines;
}

function extractContactEmail(metadata: CheckoutDraftMetadata | null): string | null {
  if (!metadata?.contact) return null;
  const email = metadata.contact.email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return trimmed.length ? trimmed : null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}
