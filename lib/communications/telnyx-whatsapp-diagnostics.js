function normalizeE164(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }
  
  async function telnyxGet(pathname, apiKey) {
    const response = await fetch(`https://api.telnyx.com${pathname}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  
    const text = await response.text();
  
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
  
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }
  
  export async function getWhatsAppDiagnostics() {
    const apiKey = String(process.env.TELNYX_API_KEY || "").trim();
    const configuredFrom = normalizeE164(process.env.TELNYX_WHATSAPP_FROM);
  
    if (!apiKey) {
      return {
        success: false,
        error: "TELNYX_API_KEY is missing.",
      };
    }
  
    if (!configuredFrom) {
      return {
        success: false,
        error: "TELNYX_WHATSAPP_FROM is missing.",
      };
    }
  
    const listResult = await telnyxGet("/v2/whatsapp/phone_numbers", apiKey);
  
    if (!listResult.ok) {
      return {
        success: false,
        configuredFrom,
        telnyxListStatus: listResult.status,
        telnyxListResponse: listResult.data,
        diagnosis:
          "Phoniq could not list WhatsApp numbers with this API key. Check that TELNYX_API_KEY belongs to the same Telnyx account that owns the WABA.",
      };
    }
  
    const rawNumbers = Array.isArray(listResult.data?.data)
      ? listResult.data.data
      : [];
  
    const registeredNumbers = rawNumbers.map((item) => ({
      phone_number: normalizeE164(
        item.phone_number ||
        item.number ||
        item.phoneNumber
      ),
      id: item.id || item.phone_number_id || null,
      phone_number_id: item.phone_number_id || null,
      waba_id: item.waba_id || item.whatsapp_business_account_id || null,
      display_name: item.display_name || item.verified_name || null,
      status: item.status || null,
      enabled:
        typeof item.enabled === "boolean"
          ? item.enabled
          : null,
      quality_rating: item.quality_rating || null,
      raw: item,
    }));
  
    const match =
      registeredNumbers.find(
        (item) => item.phone_number === configuredFrom
      ) || null;
  
    let diagnosis = "";
  
    if (!match) {
      diagnosis =
        "TELNYX_WHATSAPP_FROM is not returned by Telnyx for the API key currently used by Phoniq. This usually means the app is using an API key from a different Telnyx account/context, or the WhatsApp number has not finished API-side provisioning.";
    } else if (match.enabled === false) {
      diagnosis =
        "The API key can see the WhatsApp number, but Telnyx reports enabled=false. Finish/repair provisioning in Telnyx before sending.";
    } else {
      diagnosis =
        "The same API key can see the configured WhatsApp number. If POST /v2/messages/whatsapp still returns Invalid source number, the sender is visible but not fully send-provisioned on Telnyx/Meta. At that point this is a Telnyx provisioning issue rather than a Phoniq E.164 mismatch.";
    }
  
    return {
      success: true,
      configuredFrom,
      configuredNumberFound: Boolean(match),
      configuredNumber: match,
      registeredNumbers,
      template: {
        name:
          process.env.TELNYX_WHATSAPP_TEMPLATE_NAME ||
          "appointment_confirmation",
        language:
          process.env.TELNYX_WHATSAPP_TEMPLATE_LANGUAGE ||
          "en_US",
      },
      diagnosis,
    };
  }
  