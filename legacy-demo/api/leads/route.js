import { google } from "googleapis";
import path from "path";

const SHEET_ID = "1VaO0aiZypUmKHFjt1NUUp186cnwmKv1B9ymXnqgV9ss";
const TAB_NAME = "Demo Leads";

export async function POST(req) {
  try {
    const body = await req.json();

    const credentialsPath = path.join(
      process.cwd(),
      "credentials",
      "evocative-hour-499900-b5-f32fb688f1d4.json"
    );

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const leadId = `LEAD-${Date.now()}`;
    const date = new Date().toISOString();

    const values = [
      [
        leadId,
        date,
        body.name || "",
        body.phone || "",
        body.language || "English",
        body.serviceIssue || body.issue || "",
        body.preferredTime || body.time || "",
        body.city || "",
        body.status || "New",
        body.notes || "",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:J`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return Response.json({
      success: true,
      message: "Lead saved to Google Sheet",
      leadId,
    });
  } catch (error) {
    console.error("Google Sheets Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to save lead",
        error: error.message,
      },
      { status: 200 }
    );
  }
}