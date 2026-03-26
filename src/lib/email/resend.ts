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

export async function sendActivationCodeEmailViaResend(params: {
  to: string;
  activationCode: string;
  ticketCount: number;
}) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const sender = "noreply@savara.in";
  const appBaseUrl = getAppBaseUrl();
  const dashboardUrl = appBaseUrl ? `${appBaseUrl}/dashboard` : "/dashboard";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      reply_to: "fest@iiitdm.ac.in",
      to: [params.to],
      subject: "Savara 2026 Ticket Activation Code",
      text: `Thank you for purchasing Savara 2026 tickets! Your activation code is ${params.activationCode}. Ticket capacity: ${params.ticketCount}. Login to redeem: ${dashboardUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin-bottom: 8px;">Your Savara 2026 Ticket Activation Code</h2>
          <p style="margin: 0 0 10px;">Thank you for purchasing Savara 2026 tickets!</p>
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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${body}`);
  }
}
