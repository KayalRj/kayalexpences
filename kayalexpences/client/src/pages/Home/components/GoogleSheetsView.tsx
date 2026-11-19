import React, { useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2,
  Save, HelpCircle
} from "lucide-react";
import { GoogleSheetsConfig, saveGoogleSheetsConfig, syncAllExpensesToGoogleSheets } from "../../../lib/googleSheets";

type Expense = {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number;
  payment: string;
  notes: string;
};

type Cycle = {
  id: string;
  month: string;
  salaryDate: string;
  salary: number;
  balance: number;
  notes: string;
  budgets: { daily: number; weekly: number; monthly: number };
  expenses: Expense[];
};

type GoogleSheetsViewProps = {
  cycle: Cycle | null;
  config: GoogleSheetsConfig;
  onUpdateConfig: (newCfg: GoogleSheetsConfig) => void;
  isLight: boolean;
  money: (n: number) => string;
  monthLabel: (v: string) => string;
};

export default function GoogleSheetsView({
  cycle,
  config,
  onUpdateConfig,
  isLight,
  money,
  monthLabel,
}: GoogleSheetsViewProps) {
  const [docUrl, setDocUrl] = useState(config.docUrl || "");
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || "");
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(config.lastSyncedAt ? `Last synced: ${new Date(config.lastSyncedAt).toLocaleString()}` : null);

  const isConfigured = Boolean(docUrl.trim() || webhookUrl.trim());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GoogleSheetsConfig = {
      docUrl: docUrl.trim(),
      webhookUrl: webhookUrl.trim(),
      autoSync,
      lastSyncedAt: config.lastSyncedAt,
    };
    saveGoogleSheetsConfig(updated);
    onUpdateConfig(updated);
    toast.success("Google Sheets configuration saved! 💾");
  };

  const handleSyncAll = async () => {
    if (!config.webhookUrl || !config.webhookUrl.trim()) {
      toast.error("Please configure a Google Apps Script Webhook URL first.");
      return;
    }
    if (!cycle || !cycle.expenses.length) {
      toast.error("No expenses recorded in this month to sync.");
      return;
    }
    setSyncing(true);
    try {
      const ok = await syncAllExpensesToGoogleSheets(config.webhookUrl, cycle.month, cycle.expenses);
      if (ok) {
        const now = new Date().toISOString();
        const updated = { ...config, lastSyncedAt: now };
        saveGoogleSheetsConfig(updated);
        onUpdateConfig(updated);
        toast.success(`Successfully synced ${cycle.expenses.length} expenses to Google Sheets! 📊`);
        setLastSyncResult(`Synced ${cycle.expenses.length} entries at ${new Date().toLocaleTimeString()}`);
      } else {
        toast.error("Failed to sync to Google Sheets. Verify your Webhook URL.");
        setLastSyncResult("Sync failed. Check Webhook URL.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync to Google Sheets.");
      setLastSyncResult(`Sync error: ${err.message || "Network error"}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="sheets-page-view anim-fade-up">
      {/* Top Banner */}
      <section
        style={{
          background: isLight
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 244, 238, 0.96))"
            : "linear-gradient(135deg, rgba(14, 28, 20, 0.92), rgba(8, 18, 12, 0.96))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "18px",
          padding: "24px 28px",
          border: isLight ? "1.5px solid rgba(184, 106, 60, 0.3)" : "1.5px solid rgba(34, 197, 94, 0.4)",
          boxShadow: isLight ? "0 12px 35px rgba(80, 50, 30, 0.08)" : "0 20px 50px rgba(0, 0, 0, 0.6)",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <p className="eyebrow" style={{ color: isLight ? "#16a34a" : "#4ade80", margin: 0, fontWeight: 700 }}>
              Cloud Spreadsheet Integration
            </p>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: 700,
                background: isConfigured
                  ? (isLight ? "rgba(22, 163, 74, 0.15)" : "rgba(34, 197, 94, 0.25)")
                  : (isLight ? "rgba(217, 119, 6, 0.15)" : "rgba(245, 158, 11, 0.25)"),
                color: isConfigured ? (isLight ? "#15803d" : "#86efac") : (isLight ? "#b45309" : "#fde68a"),
                border: isConfigured ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(245, 158, 11, 0.4)",
              }}
            >
              {isConfigured ? "● Connected" : "○ Not Configured"}
            </span>
          </div>
          <h2 style={{ fontSize: "1.75rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800, margin: "4px 0" }}>
            Google Sheets Synchronizer
          </h2>
          <p style={{ color: isLight ? "#6e5445" : "#bbf7d0", fontSize: "13px" }}>
            Export and real-time synchronize your Kayal Expense entries with your private Google Spreadsheet.
          </p>
        </div>

        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: isLight ? "rgba(22, 163, 74, 0.1)" : "rgba(34, 197, 94, 0.2)",
              border: isLight ? "1px solid rgba(22, 163, 74, 0.3)" : "1px solid rgba(34, 197, 94, 0.4)",
              color: isLight ? "#15803d" : "#86efac",
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={15} /> Open Google Sheet
          </a>
        )}
      </section>

      {/* Two-Column Grid: Settings Form & Sync Actions */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* Settings Form */}
        <div
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.88), rgba(16, 9, 6, 0.94))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "18px",
            padding: "24px",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(198, 116, 68, 0.35)",
            boxShadow: isLight ? "0 10px 30px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ marginBottom: "18px" }}>
            <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Connection Setup</p>
            <h3 style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Sheet Credentials</h3>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: isLight ? "#4a3528" : "#dfc7b5", marginBottom: "6px" }}>
                Google Spreadsheet URL or Sheet ID
              </label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={docUrl}
                onChange={e => setDocUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: isLight ? "#ffffff" : "rgba(36, 11, 22, 0.95)",
                  border: isLight ? "1.5px solid #dcc6b5" : "1.5px solid rgba(198, 116, 68, 0.35)",
                  color: isLight ? "#1f1610" : "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: isLight ? "#4a3528" : "#dfc7b5", marginBottom: "6px" }}>
                Google Apps Script Webhook URL (Required for automatic sync)
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: isLight ? "#ffffff" : "rgba(36, 11, 22, 0.95)",
                  border: isLight ? "1.5px solid #dcc6b5" : "1.5px solid rgba(198, 116, 68, 0.35)",
                  color: isLight ? "#1f1610" : "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
              <input
                type="checkbox"
                id="autoSyncCheck"
                checked={autoSync}
                onChange={e => setAutoSync(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#b86a3c" }}
              />
              <label htmlFor="autoSyncCheck" style={{ fontSize: "13px", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 600, cursor: "pointer" }}>
                Automatically sync every new expense when recorded
              </label>
            </div>

            <button
              type="submit"
              className="button primary"
              style={{
                marginTop: "6px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Save size={16} /> Save Google Sheets Settings
            </button>
          </form>
        </div>

        {/* Sync Actions & Guide */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Manual Sync Card */}
          <div
            style={{
              background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.88), rgba(16, 9, 6, 0.94))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "18px",
              padding: "24px",
              border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(198, 116, 68, 0.35)",
              boxShadow: isLight ? "0 10px 30px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Bulk Synchronization</p>
              <h3 style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Sync Current Cycle</h3>
              <p style={{ color: isLight ? "#6e5445" : "#dfc7b5", fontSize: "12px" }}>
                Send all {cycle ? cycle.expenses.length : 0} recorded expenses for {cycle ? monthLabel(cycle.month) : "this cycle"} to your Google Sheet.
              </p>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={syncing || !cycle || !cycle.expenses.length}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: "10px",
                background: syncing
                  ? "rgba(100, 116, 139, 0.3)"
                  : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: syncing ? "not-allowed" : "pointer",
                boxShadow: syncing ? "none" : "0 6px 18px rgba(22, 163, 74, 0.35)",
              }}
            >
              <RefreshCw size={16} className={syncing ? "spin-icon" : ""} />
              {syncing ? "Synchronizing to Google Sheets..." : `Sync All ${cycle ? cycle.expenses.length : 0} Expenses Now`}
            </button>

            {lastSyncResult && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: isLight ? "rgba(22, 163, 74, 0.1)" : "rgba(34, 197, 94, 0.15)",
                  border: isLight ? "1px solid rgba(22, 163, 74, 0.25)" : "1px solid rgba(34, 197, 94, 0.3)",
                  color: isLight ? "#15803d" : "#86efac",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle2 size={14} />
                <span>{lastSyncResult}</span>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div
            style={{
              background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.88), rgba(16, 9, 6, 0.94))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "18px",
              padding: "24px",
              border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(198, 116, 68, 0.35)",
              boxShadow: isLight ? "0 10px 30px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <HelpCircle size={18} style={{ color: isLight ? "#b86a3c" : "#e59b6e" }} />
              <h3 style={{ fontSize: "1.2rem", color: isLight ? "#1f1610" : "#ffffff", margin: 0 }}>How It Works</h3>
            </div>
            <ul style={{ paddingLeft: "18px", margin: 0, color: isLight ? "#5c3c26" : "#dfc7b5", fontSize: "12px", lineHeight: "1.7" }}>
              <li>Paste your Google Spreadsheet link above so you can open it with one click anytime.</li>
              <li>When you click <strong>Sync All</strong>, expenses are formatted with Date, Name, Category, Payment, and Amount.</li>
              <li>Optionally configure a Google Apps Script Webhook to automatically append every new expense in real time.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
