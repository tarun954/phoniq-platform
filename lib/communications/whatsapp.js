function normalizeE164(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function isNonRoutableNanp555(number) {
  // +1 555 xxx xxxx uses NPA 555.
  // NANPA does not assign 555 as an area code/NPA.
  return /^\+1555\d{7}$/.test(number);
}

export async function sendWhatsAppConfirmation(input = {}) {
  const apiKey = String(process.env.TELNYX_API_KEY || "").trim();
  const from = normalizeE164(process.env.TELNYX_WHATSAPP_FROM);
  const to = normalizeE164(
    input.to ||
    input.phone ||
    input.customerPhone ||
    input.customer_phone
  );

  if (!apiKey) throw new Error("TELNYX_API_KEY is missing.");
  if (!from) throw new Error("TELNYX_WHATSAPP_FROM is missing.");
  if (!to) throw new Error("Customer WhatsApp number is missing.");

  if (isNonRoutableNanp555(from)) {
    throw new Error(
      `${from} is a +1 555 test/non-routable number, not a real North American Telnyx DID. Telnyx can show it as CONNECTED to the WABA, but the message sender endpoint rejects it as an invalid source. Buy/assign a real Telnyx number with an active messaging profile, register that exact number under WhatsApp Messaging, then update TELNYX_WHATSAPP_FROM.`
    );
  }

  const customerName =
    input.customerName ||
    input.customer_name ||
    input.name ||
    "Customer";

  const companyName =
    input.companyName ||
    input.company_name ||
    "Service Company";

  const appointmentTime =
    input.appointmentTime ||
    input.appointment_time ||
    input.scheduledAt ||
    "your requested appointment time";

  const payload = {
    from,
    to,
    whatsapp_message: {
      type: "template",
      template: {
        name:
          process.env.TELNYX_WHATSAPP_TEMPLATE_NAME ||
          "appointment_confirmation",
        language: {
          policy: "deterministic",
          code:
            process.env.TELNYX_WHATSAPP_TEMPLATE_LANGUAGE ||
            "en_US",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(customerName) },
              { type: "text", text: String(companyName) },
              { type: "text", text: String(appointmentTime) },
            ],
          },
        ],
      },
    },
  };

  const response = await fetch(
    "https://api.telnyx.com/v2/messages/whatsapp",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.error(
      "TELNYX WHATSAPP ERROR:",
      JSON.stringify(data, null, 2)
    );

    const detail =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.title ||
      `WhatsApp send failed (${response.status})`;

    throw new Error(detail);
  }

  return data;
}
