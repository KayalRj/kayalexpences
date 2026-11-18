export type GoogleSheetsConfig = {
  webhookUrl: string;
  docUrl: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
};

const SHEETS_CONFIG_KEY = "kayal-expenses-google-sheets-config";

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const raw = localStorage.getItem(SHEETS_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load Google Sheets config:", e);
  }
  return {
    webhookUrl: "",
    docUrl: "",
    autoSync: false,
    lastSyncedAt: null,
  };
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
}

export const APPS_SCRIPT_TEMPLATE = `// Copy & Paste this into Google Sheets -> Extensions -> Apps Script
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Create header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "Date", "Expense Name", "Category", "Payment Method", "Amount (INR)", "Notes", "Salary Month", "Last Synced"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8d4f2e").setFontColor("#ffffff");
    }

    if (data.action === "sync_all") {
      // Clear existing records except headers
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).clearContent();
      }
      var rows = (data.expenses || []).map(function(item) {
        return [
          item.id,
          item.date,
          item.name,
          item.category,
          item.payment,
          item.amount,
          item.notes,
          data.month || "",
          new Date().toLocaleString()
        ];
      });
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 9).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "add" || data.action === "update" || data.action === "delete") {
      var item = data.expense;
      if (item) {
        sheet.appendRow([
          item.id,
          item.date,
          item.name,
          item.category,
          item.payment,
          item.amount,
          item.notes,
          data.month || "",
          new Date().toLocaleString()
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export async function syncAllExpensesToGoogleSheets(
  webhookUrl: string,
  month: string,
  expenses: any[]
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.trim()) return false;
  try {
    const payload = {
      action: "sync_all",
      month,
      expenses,
      timestamp: new Date().toISOString(),
    };
    // Use no-cors mode to support Google Apps Script redirect POSTs cleanly from browser
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return false;
  }
}

export async function syncSingleExpenseToGoogleSheets(
  webhookUrl: string,
  month: string,
  action: "add" | "update" | "delete",
  expense: any
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.trim()) return false;
  try {
    const payload = {
      action,
      month,
      expense,
      timestamp: new Date().toISOString(),
    };
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Error syncing single expense to Google Sheets:", error);
    return false;
  }
}
