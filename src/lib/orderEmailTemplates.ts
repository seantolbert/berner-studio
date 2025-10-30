import type { OrderSummary } from "@/lib/orderSummary";
import { collectBoardCustomizations, type BoardCustomizationDetail } from "@/lib/orderBoardDetails";

export function buildMerchantEmailText(
  summary: OrderSummary,
  boardDetails: BoardCustomizationDetail[] = collectBoardCustomizations(summary.items)
): string {
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
  if (boardDetails.length) {
    lines.push("Board customizations:");
    boardDetails.forEach((detail, idx) => {
      lines.push(`  ${idx + 1}. ${detail.itemName} (x${detail.quantity})`);
      detail.fields.forEach((field) => {
        lines.push(`     ${field.label}: ${field.value}`);
      });
      lines.push("");
    });
  }
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

export function buildMerchantEmailHtml(
  summary: OrderSummary,
  boardDetails: BoardCustomizationDetail[] = collectBoardCustomizations(summary.items)
): string {
  const itemsHtml = summary.items
    .map(
      (item) =>
        `<li>${escapeHtml(String(item.quantity))} × ${escapeHtml(item.name)} — ${escapeHtml(item.lineTotal)} <span style="color:#555">(${escapeHtml(item.unitPrice)} ea)</span></li>`
    )
    .join("");
  const shipToHtml = summary.shippingAddressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
  const billingHtml = summary.billingAddressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
  const boardDetailsHtml = boardDetails.length
    ? `<div>
        <p><strong>Board customizations:</strong></p>
        <ol style="margin:0 0 16px 16px;padding:0;">
          ${boardDetails
            .map((detail) => {
              const fieldsHtml = detail.fields
                .map(
                  (field) =>
                    `<li style="margin:2px 0;"><strong>${escapeHtml(field.label)}:</strong> ${escapeHtml(field.value)}</li>`
                )
                .join("");
              return `<li style="margin-bottom:12px;">
                <div><strong>${escapeHtml(detail.itemName)}</strong> <span style="color:#555;">(x${escapeHtml(String(detail.quantity))})</span></div>
                <ul style="margin:6px 0 0 16px;padding:0;list-style:disc;">
                  ${fieldsHtml}
                </ul>
              </li>`;
            })
            .join("")}
        </ol>
      </div>`
    : "";

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
      ${boardDetailsHtml}
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

export function buildCustomerEmailText(summary: OrderSummary): string {
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

export function buildCustomerEmailHtml(summary: OrderSummary): string {
  const itemsHtml = summary.items
    .map(
      (item) =>
        `<li>${escapeHtml(String(item.quantity))} × ${escapeHtml(item.name)} — ${escapeHtml(item.lineTotal)}</li>`
    )
    .join("");
  const shipToHtml = summary.shippingAddressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");

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

export function buildMerchantSms(summary: OrderSummary): string {
  const primaryItem = summary.items[0];
  const additionalCount = Math.max(0, summary.items.length - 1);
  const itemPart = primaryItem
    ? `${primaryItem.quantity}× ${primaryItem.name}${additionalCount ? ` (+${additionalCount} more)` : ""}`
    : "Items available in admin";
  return `New order ${summary.total} from ${summary.customerName}. ${itemPart}. Order ${summary.orderShortId}.`;
}

function escapeHtml(value: string): string {
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
