const SECRET = PropertiesService.getScriptProperties().getProperty("LAYOUTR_ANALYTICS_SECRET");

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const sheetName = payload.sheet;
    const row = payload.row || {};
    const secret = payload.secret || "";

    if (SECRET && secret !== SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (!sheetName || typeof row !== "object") {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ error: `Missing sheet: ${sheetName}` }, 404);
    }

    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = headerRow.map((header) => (header in row ? row[header] : ""));
    sheet.appendRow(values);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

function jsonResponse(payload, status) {
  return ContentService.createTextOutput(JSON.stringify({ status, ...payload })).setMimeType(
    ContentService.MimeType.JSON
  );
}
