import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "@/lib/env";

export type SendEmailInput = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email service is not configured");
    this.name = "EmailNotConfiguredError";
  }
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new EmailNotConfiguredError();
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : data?.error?.message ?? "Failed to send email";
    throw new Error(message);
  }

  return data;
}
