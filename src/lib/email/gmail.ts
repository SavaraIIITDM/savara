import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getAppBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  if (productionUrl) {
    return `https://${productionUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "";
}

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not configured");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendActivationCodeEmail(params: {
  to: string;
  activationCode: string;
  ticketCount: number;
}) {
  const sender = process.env.GMAIL_USER;
  if (!sender) {
    throw new Error("GMAIL_USER is not configured");
  }

  const mailer = getTransporter();
  const appBaseUrl = getAppBaseUrl();
  const dashboardUrl = appBaseUrl ? `${appBaseUrl}/dashboard` : "/dashboard";

  await mailer.sendMail({
    from: `"IIITDM Fest" <${sender}>`,
    to: params.to,
    subject: "Savara 2027 Ticket Activation Code",
    text: `Thank you for purchasing Savara 2027 tickets! Your activation code is ${params.activationCode}. Ticket capacity: ${params.ticketCount}. Login to redeem: ${dashboardUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin-bottom: 8px;">Your Savara 2027 Ticket Activation Code</h2>
        <p style="margin: 0 0 10px;">Thank you for purchasing Savara 2027 tickets!</p>
        <p style="margin: 0 0 10px;">Enter this code in the savara.in dashboard to activate tickets.</p>
        <p style="margin: 0 0 4px;"><strong>Activation code:</strong> ${params.activationCode}</p>
        <p style="margin: 0 0 16px;"><strong>Code is valid for</strong> ${params.ticketCount} users.</p>
        <p style="margin: 0 0 16px;">To get your ticket, enter this code in the dashboard link below. ${params.ticketCount > 1 ? "You can share this code with your friends to redeem" : ""}</p>
        <a
          href="${dashboardUrl}"
          style="display: inline-block; background: #d4a574; color: #0a0408; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 600;"
        >
          Dashboard to Redeem Code
        </a>
      </div>
    `,
  });
}
