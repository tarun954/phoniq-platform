import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTeamInvitationEmail({
  to,
  companyName,
  roleName,
  inviteUrl,
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const from =
    process.env.PHONIQ_EMAIL_FROM ||
    "Phoniq <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `You've been invited to join ${companyName} on Phoniq`,
    html: `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:32px;
        color:#111827;
      ">

        <div style="
          font-size:24px;
          font-weight:700;
          margin-bottom:28px;
        ">
          Phoniq
        </div>

        <h1 style="
          font-size:24px;
          margin-bottom:16px;
        ">
          You've been invited
        </h1>

        <p style="
          font-size:16px;
          line-height:1.6;
          color:#4b5563;
        ">
          You've been invited to join
          <strong>${companyName}</strong>
          on Phoniq.
        </p>

        <p style="
          font-size:16px;
          line-height:1.6;
          color:#4b5563;
        ">
          Your assigned role is:
          <strong>${roleName}</strong>
        </p>

        <div style="margin:32px 0;">
          <a
            href="${inviteUrl}"
            style="
              background:#111827;
              color:#ffffff;
              padding:14px 22px;
              border-radius:8px;
              text-decoration:none;
              font-weight:600;
              display:inline-block;
            "
          >
            Accept Invitation
          </a>
        </div>

        <p style="
          font-size:13px;
          color:#6b7280;
          line-height:1.5;
        ">
          If you weren't expecting this invitation,
          you can safely ignore this email.
        </p>

      </div>
    `,
  });

  if (error) {
    throw new Error(
      error.message || "Unable to send invitation email."
    );
  }

  return data;
}