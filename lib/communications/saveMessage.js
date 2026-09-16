export async function saveMessage({
    admin,
    organizationId,
    customerId = null,
    leadId = null,
    channel,
    direction,
    provider = null,
    providerMessageId = null,
    recipient = null,
    sender = null,
    body,
    subject = null,
    status = "sent",
    errorMessage = null,
    sentAt = null,
    failedAt = null,
  }) {
    if (!admin) {
      throw new Error("admin client is required.");
    }
  
    if (!organizationId) {
      throw new Error("organizationId is required.");
    }
  
    if (!channel) {
      throw new Error("channel is required.");
    }
  
    if (!direction) {
      throw new Error("direction is required.");
    }
  
    if (!body) {
      throw new Error("body is required.");
    }
  
    const { data, error } = await admin
      .from("messages")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        lead_id: leadId,
  
        channel,
        direction,
        provider,
  
        provider_message_id:
          providerMessageId,
  
        recipient,
        sender,
  
        body,
        subject,
  
        status,
  
        sent_at:
          sentAt ||
          (status === "sent"
            ? new Date().toISOString()
            : null),
  
        failed_at:
          failedAt ||
          (status === "failed"
            ? new Date().toISOString()
            : null),
  
        error_message:
          errorMessage,
      })
      .select("*")
      .single();
  
    if (error) {
      console.error(
        "MESSAGE SAVE ERROR:",
        error
      );
  
      throw error;
    }
  
    return data;
  }