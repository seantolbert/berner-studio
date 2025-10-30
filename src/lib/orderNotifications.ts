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
import { buildOrderSummary, extractContactEmail } from "@/lib/orderSummary";
import {
  buildMerchantEmailHtml,
  buildMerchantEmailText,
  buildCustomerEmailHtml,
  buildCustomerEmailText,
  buildMerchantSms,
} from "@/lib/orderEmailTemplates";
import { collectBoardCustomizations } from "@/lib/orderBoardDetails";

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
  const boardDetails = collectBoardCustomizations(summary.items);
  if (boardDetails.length) {
    console.info("[notifyMerchant] Board customizations captured", {
      orderId: order.id,
      details: boardDetails,
    });
  } else if (summary.items.some((item) => item.config)) {
    console.warn("[notifyMerchant] Board config present but customization details empty", {
      orderId: order.id,
      itemIds: summary.items.map((item) => item.itemId),
      summaryItems: summary.items,
    });
  }

  let emailSent = false;
  if (emailRecipients.length && hasEmailTransport()) {
    try {
      await sendEmail({
        to: emailRecipients,
        subject: `New order: ${summary.total} from ${summary.customerName}`,
        text: buildMerchantEmailText(summary, boardDetails),
        html: buildMerchantEmailHtml(summary, boardDetails),
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
