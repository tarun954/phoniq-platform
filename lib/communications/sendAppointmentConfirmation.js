export async function sendAppointmentConfirmation({
    customerName,
    email,
    phone,
    companyName,
    appointmentTime,
  }) {
    const results = {
      email: { attempted:false, success:false },
      whatsapp: { attempted:false, success:false },
    };
  
    if (email && process.env.RESEND_API_KEY) {
      results.email.attempted = true;
  
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.PHONIQ_EMAIL_FROM || "Phoniq <onboarding@resend.dev>",
            to: [email],
            subject: `${companyName} appointment confirmation`,
            html: `
              <p>Hi ${customerName},</p>
              <p>Your service appointment with <strong>${companyName}</strong> is confirmed for <strong>${appointmentTime}</strong>.</p>
              <p>We will contact you if any additional confirmation is required.</p>
              <p>Powered by Phoniq</p>
            `,
          }),
        });
  
        results.email.success = response.ok;
        results.email.response = response.ok ? await response.json() : await response.text();
      } catch (error) {
        results.email.error = error?.message || "Email failed.";
      }
    }
  
    if (phone && process.env.TELNYX_API_KEY && process.env.TELNYX_WHATSAPP_FROM) {
      results.whatsapp.attempted = true;
  
      try {
        const response = await fetch("https://api.telnyx.com/v2/messages/whatsapp", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.TELNYX_WHATSAPP_FROM,
            to: phone,
            whatsapp_message: {
              type: "template",
              template: {
                name: process.env.TELNYX_WHATSAPP_TEMPLATE_NAME || "appointment_confirmation",
                language: {
                  policy: "deterministic",
                  code: process.env.TELNYX_WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
                },
                components: [{
                  type: "body",
                  parameters: [
                    { type:"text", text:String(customerName) },
                    { type:"text", text:String(companyName) },
                    { type:"text", text:String(appointmentTime) },
                  ],
                }],
              },
            },
          }),
        });
  
        results.whatsapp.success = response.ok;
        results.whatsapp.response = response.ok ? await response.json() : await response.text();
      } catch (error) {
        results.whatsapp.error = error?.message || "WhatsApp failed.";
      }
    }
  
    return results;
  }
  