/**
 * Clockout Phase 0 — Google Sheets waitlist capture
 *
 * SETUP (5 min):
 *  1. Create a Google Sheet. In row 1 add headers:
 *     timestamp | email | name | role | tier | intent | source
 *  2. Extensions → Apps Script. Delete the stub, paste this file, Save.
 *  3. Deploy → New deployment → type "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Deploy → authorize the permissions prompt.
 *  4. Copy the Web app URL (ends in /exec) and put it in .env.local:
 *       VITE_WAITLIST_ENDPOINT="https://script.google.com/macros/s/AKfy.../exec"
 *
 * The app sends a text/plain POST (no-cors), so the body arrives as a JSON
 * string in e.postData.contents — parsed below. New signups append as rows.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // avoid lost writes if two people submit at once
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = e.parameter || {};
    }
    sheet.appendRow([
      new Date(),
      data.email || '',
      data.name || '',
      data.role || '',
      data.tier || '',
      data.intent || '',
      data.source || '',
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Lets you confirm the deployment is live by visiting the /exec URL in a browser.
function doGet() {
  return ContentService
    .createTextOutput('Clockout capture endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
