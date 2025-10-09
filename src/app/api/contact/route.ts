import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEmails, hasEmailTransport } from "@/lib/env";
import { EmailNotConfiguredError, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(2000),
});

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
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

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, message } = parsed.data;
  const recipients = getAdminEmails();
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Admin emails not configured" }, { status: 500 });
  }
  if (!hasEmailTransport()) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const subject = `New contact inquiry${name ? ` from ${name}` : ""}`;
  const textBody = `You have a new message from the website contact form.

Name: ${name || "Not provided"}
Email: ${email}

Message:
${message}
`;
  const sanitizedMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const htmlBody = `<p>You have a new message from the website contact form.</p>
  <p><strong>Name:</strong> ${escapeHtml(name ?? "Not provided")}<br />
  <strong>Email:</strong> ${escapeHtml(email)}</p>
  <p><strong>Message</strong></p>
  <p>${sanitizedMessage}</p>`;

  try {
    await sendEmail({ to: recipients, subject, text: textBody, html: htmlBody });
  } catch (error: unknown) {
    if (error instanceof EmailNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
