import { Buffer } from "node:buffer";
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, hasSmsTransport } from "@/lib/env";

export type SendSmsInput = {
  to: string;
  body: string;
};

export class SmsNotConfiguredError extends Error {
  constructor() {
    super("SMS service is not configured");
    this.name = "SmsNotConfiguredError";
  }
}

export async function sendSms({ to, body }: SendSmsInput) {
  if (!hasSmsTransport()) {
    throw new SmsNotConfiguredError();
  }

  const accountSid = TWILIO_ACCOUNT_SID;
  const authToken = TWILIO_AUTH_TOKEN;
  const fromNumber = TWILIO_FROM_NUMBER;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const payload = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) errorDetail = data.message;
    } catch {
      // ignore parse failures
    }
    const statusText = response.statusText || "Failed to send SMS";
    throw new Error(errorDetail ? `${statusText}: ${errorDetail}` : statusText);
  }

  return response.json();
}
