import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendAppointmentEmail({
  to,
  customerName,
  companyName,
  appointmentTime,
  serviceAddress,
}) {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  const from =
    process.env.PHONIQ_EMAIL_FROM ||
    "Phoniq <onboarding@resend.dev>";

  const subject = `Your appointment request with ${companyName}`;

  const html = `
    <div style="
      font-family: Arial, Helvetica, sans-serif;
      max-width: 620px;
      margin: 0 auto;
      color: #111827;
      line-height: 1.6;
    ">

      <div style="
        padding: 24px 0;
        border-bottom: 1px solid #e5e7eb;
      ">
        <div style="
          font-size: 22px;
          font-weight: 700;
        ">
          ${companyName}
        </div>
      </div>

      <div style="padding: 32px 0;">

        <p>
          Hi ${customerName || "there"},
        </p>

        <p>
          Thank you for choosing ${companyName}.
          Your service appointment request has been received.
        </p>

        <div style="
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        ">

          <div style="
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 6px;
          ">
            Appointment
          </div>

          <div style="
            font-size: 17px;
            font-weight: 600;
          ">
            ${appointmentTime}
          </div>

          ${
            serviceAddress
              ? `
                <div style="
                  font-size: 12px;
                  font-weight: 700;
                  color: #64748b;
                  text-transform: uppercase;
                  margin-top: 18px;
                  margin-bottom: 6px;
                ">
                  Service Address
                </div>

                <div>
                  ${serviceAddress}
                </div>
              `
              : ""
          }

        </div>

        <p>
          A team member will contact you if any additional
          confirmation is required.
        </p>

        <p>
          Thank you,<br />
          <strong>${companyName}</strong>
        </p>

      </div>

      <div style="
        border-top: 1px solid #e5e7eb;
        padding: 20px 0;
        font-size: 12px;
        color: #94a3b8;
      ">
        Powered by Phoniq
      </div>

    </div>
  `;

  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(
      error.message || "Resend failed to send email"
    );
  }

  return data;
}