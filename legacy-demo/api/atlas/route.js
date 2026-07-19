import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages, lead } = await req.json();

    const systemPrompt = `
You are Atlas, an AI Revenue Agent for HVAC companies.

Your job is NOT to be a normal chatbot.
Your job is to convert visitors/callers into appointment-ready leads.

Rules:
- Keep replies short, clear, friendly.
- Ask one question at a time.
- Never give exact pricing.
- Do not say appointment is confirmed. Say appointment request is captured.
- Detect urgency.
- Collect: name, phone, city, issue, preferred time.
- Offer appointment slots when needed:
  Today 2 PM, Today 4 PM, Tomorrow 10 AM, Tomorrow 4 PM.
- Respond in the same language as the customer when obvious.
- If emergency/no AC/no heat/not working/stopped working, mark score Hot or Critical.
- Return JSON only.

Return this JSON shape:
{
  "reply": "message to customer",
  "lead": {
    "name": "",
    "phone": "",
    "language": "English",
    "serviceIssue": "",
    "preferredTime": "",
    "city": "",
    "status": "New / Appointment Requested / Missed Call Recovered / Priority Emergency / After-Hours Captured",
    "score": "Normal / Warm / Hot / Critical",
    "estimatedValue": "$500 - $3,000",
    "notes": ""
  },
  "done": false
}

Current lead:
${JSON.stringify(lead)}
`;

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })),
      ],
    });

    let text = response.output_text.trim();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (error) {
    console.error("Atlas AI Error:", error);

    return Response.json(
      {
        reply:
          "I can help with that. Can you share your name, phone number, city, and preferred appointment time?",
        lead: {
          name: "",
          phone: "",
          language: "English",
          serviceIssue: "",
          preferredTime: "",
          city: "",
          status: "New",
          score: "Warm",
          estimatedValue: "$500 - $3,000",
          notes: "Fallback response used",
        },
        done: false,
        error: error.message,
      },
      { status: 200 }
    );
  }
}