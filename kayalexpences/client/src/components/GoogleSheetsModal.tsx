import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, FileSpreadsheet, RefreshCw, X, Zap } from "lucide-react";
import {
  APPS_SCRIPT_TEMPLATE,
  GoogleSheetsConfig,
  saveGoogleSheetsConfig,
  syncAllExpensesToGoogleSheets,
} from "../lib/googleSheets";

type Props = {
  config: GoogleSheetsConfig;
  activeCycle: any | null;
  onClose: () => void;
  onConfigChange: (newConfig: GoogleSheetsConfig) => void;
};

export default function GoogleSheetsModal({
  config,
  activeCycle,
  onClose,
  onConfigChange,
}: Props) {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || "");
  const [docUrl, setDocUrl] = useState(config.docUrl || "");
  const [autoSync, setAutoSync] = useState(config.autoSync ?? false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"settings" | "instructions">("settings");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let finalDocUrl = docUrl.trim();
    let finalWebhookUrl = webhookUrl.trim();

    if (finalWebhookUrl.includes("docs.google.com/spreadsheets") && !finalDocUrl) {
      finalDocUrl = finalWebhookUrl;
    }

    const updated: GoogleSheetsConfig = {
      ...config,
      webhookUrl: finalWebhookUrl,
      docUrl: finalDocUrl,
      autoSync: (finalDocUrl || finalWebhookUrl) ? true : autoSync,
    };
    saveGoogleSheetsConfig(updated);
    onConfigChange(updated);
    toast.success("Google Sheets URL saved! Expenses will automatically sync.");
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    toast.success("Google Apps Script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncNow = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Please enter a valid Google Apps Script Web App URL first.");
      return;
    }
    if (!activeCycle || !activeCycle.expenses?.length) {
      toast.error("No expenses found in current salary cycle to sync.");
      return;
    }

    setIsSyncing(true);
    const success = await syncAllExpensesToGoogleSheets(
      webhookUrl,
      activeCycle.month,
      activeCycle.expenses
    );
    setIsSyncing(false);

    if (success) {
      const now = new Date().toLocaleString();
      const updated: GoogleSheetsConfig = {
        ...config,
        webhookUrl: webhookUrl.trim(),
        docUrl: docUrl.trim(),
        autoSync,
        lastSyncedAt: now,
      };
      saveGoogleSheetsConfig(updated);
      onConfigChange(updated);
      toast.success(
        `Successfully synced ${activeCycle.expenses.length} expense(s) to Google Sheets!`
      );
    } else {
      toast.error("Failed to sync with Google Sheets. Please check your Web App URL.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal sheets-modal" style={{ maxWidth: "600px" }}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 6px 16px rgba(184, 106, 60, 0.35)"
            }}
          >
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <p className="eyebrow" style={{ margin: 0, color: "#e59b6e" }}>Direct Integration</p>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#ffffff", fontWeight: 800 }}>Google Sheets Sync</h2>
          </div>
        </div>

        <p className="modal-subtitle" style={{ marginBottom: "20px", color: "#dfc7b5" }}>
          Connect Kayal Expenses directly with Google Sheets to keep your budget automatically updated in real-time.
        </p>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(198, 116, 68, 0.35)",
            paddingBottom: "12px",
          }}
        >
          <button
            type="button"
            className={`button ${tab === "settings" ? "primary" : "ghost"}`}
            onClick={() => setTab("settings")}
            style={{ padding: "8px 16px", fontSize: "0.88rem", borderRadius: "10px" }}
          >
            Settings & Sync
          </button>
          <button
            type="button"
            className={`button ${tab === "instructions" ? "primary" : "ghost"}`}
            onClick={() => setTab("instructions")}
            style={{ padding: "8px 16px", fontSize: "0.88rem", borderRadius: "10px" }}
          >
            1-Min Setup Guide
          </button>
        </div>

        {tab === "settings" ? (
          <form className="modal-form" onSubmit={handleSave}>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <label className="field">
                <span>
                  Google Apps Script Web App URL <b>*</b>
                </span>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <small style={{ color: "#8d7b6e" }}>
                  Paste the deployment Web App URL from your Google Sheet.
                </small>
              </label>

              <label className="field">
                <span>Direct Google Sheet URL (Optional)</span>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                />
                <small style={{ color: "#8d7b6e" }}>
                  Direct link to quickly open your Google Sheet in 1 click.
                </small>
              </label>
            </div>

            {/* Auto sync switch */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                border: "1px solid rgba(198, 116, 68, 0.35)",
                margin: "16px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Zap size={20} style={{ color: autoSync ? "#e59b6e" : "#dfc7b5" }} />
                <div>
                  <strong style={{ display: "block", fontSize: "0.92rem", color: "#ffffff" }}>
                    Real-time Auto Sync
                  </strong>
                  <small style={{ color: "#dfc7b5" }}>
                    Automatically push expenses to Google Sheets as you add/edit them.
                  </small>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#b86a3c" }}
              />
            </div>

            {/* Sync Now & Open Sheet bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                margin: "20px 0",
                padding: "14px 18px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(198, 116, 68, 0.35)",
                borderRadius: "14px",
              }}
            >
              <div>
                <small style={{ display: "block", color: "#dfc7b5", fontSize: "11px" }}>
                  {config.lastSyncedAt
                    ? `Last synced: ${config.lastSyncedAt}`
                    : "Not synced yet"}
                </small>
                <strong style={{ fontSize: "0.9rem", color: "#ffffff" }}>
                  {activeCycle?.expenses?.length || 0} expense(s) ready to sync
                </strong>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {docUrl.trim() && (
                  <a
                    href={docUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button export"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eee4d8", color: "#6e5440", border: "1px solid rgba(220, 206, 190, 0.9)", borderRadius: "10px", padding: "8px 12px" }}
                  >
                    <ExternalLink size={14} /> Open Sheet
                  </a>
                )}

                <button
                  type="button"
                  className="button primary"
                  disabled={isSyncing || !webhookUrl.trim()}
                  onClick={handleSyncNow}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "10px", padding: "8px 16px" }}
                >
                  <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button ghost"
                onClick={onClose}
              >
                Close
              </button>
              <button className="button primary" type="submit">
                <Check size={16} /> Save Configuration
              </button>
            </div>
          </form>
        ) : (
          /* Instructions Tab */
          <div style={{ fontSize: "0.9rem", color: "var(--foreground, #3f312b)" }}>
            <p style={{ margin: "0 0 12px 0" }}>
              Follow these 3 simple steps to connect your Google Sheet:
            </p>

            <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px", margin: "0 0 16px 0" }}>
              <li>
                <strong>Open your Google Sheet</strong>, click on top menu: <code>Extensions</code> &rarr; <code>Apps Script</code>.
              </li>
              <li>
                Delete any existing code and <strong>paste the script below</strong> into the editor.
                <div style={{ position: "relative", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="button export"
                    onClick={handleCopyScript}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.75rem",
                      zIndex: 2,
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy Script"}
                  </button>
                  <pre
                    style={{
                      background: "#282c34",
                      color: "#abb2bf",
                      padding: "12px",
                      borderRadius: "6px",
                      maxHeight: "150px",
                      overflowY: "auto",
                      fontSize: "0.78rem",
                      margin: 0,
                    }}
                  >
                    {APPS_SCRIPT_TEMPLATE}
                  </pre>
                </div>
              </li>
              <li>
                Click <strong>Deploy &rarr; New deployment</strong>.<br />
                - Select type: <strong>Web App</strong><br />
                - Execute as: <strong>Me</strong><br />
                - Who has access: <strong>Anyone</strong><br />
                Click <strong>Deploy</strong>, copy the resulting <code>Web App URL</code>, and paste it into the Settings tab!
              </li>
            </ol>

            <div className="modal-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => setTab("settings")}
              >
                Go to Settings & Paste URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
