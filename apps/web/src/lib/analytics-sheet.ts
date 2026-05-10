type SheetName = "visitor_events" | "waitlist_signups";

export async function appendAnalyticsSheetRow(sheet: SheetName, row: Record<string, unknown>) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sheet,
        row,
        sent_at: new Date().toISOString(),
        secret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ?? "",
      }),
      cache: "no-store",
    });
  } catch {
    // Best-effort logging only. Product flow should not fail because the sheet is unavailable.
  }
}
