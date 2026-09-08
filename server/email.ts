import nodemailer from "nodemailer";

export async function sendDeliveryEmail(to: string | null, productTitle: string, downloadUrl: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!to || !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return;
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transport.sendMail({ from: SMTP_USER, to, subject: `Your DevMarket download is ready: ${productTitle}`, text: `Your purchase is confirmed. Download ${productTitle}: ${downloadUrl}`, html: `<p>Your purchase is confirmed.</p><p><strong>${productTitle}</strong> is ready to download.</p><p><a href="${downloadUrl}">Download your product</a></p>` });
}
