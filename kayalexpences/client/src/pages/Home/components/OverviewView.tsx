import React from "react";
import {
  CalendarDays, Plus, Wallet, CircleDollarSign, ArrowUpRight, ArrowDownRight,
  Check, Bell, AlertTriangle, ChevronRight, Receipt, BarChart3, Target, ArrowRight,
  FileSpreadsheet, Edit3, Trash2
} from "lucide-react";

type Expense = {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number;
  payment: string;
  notes: string;
  valid?: boolean;
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

type OverviewViewProps = {
  cycle: Cycle;
  stats: {
    available: number;
    total: number;
    remaining: number;
    todayTotal: number;
    weekTotal: number;
    byCategory: { category: string; value: number }[];
    expenses: Expense[];
  };
  alertItems: { tone: string; title: string; detail: string }[];
  isLight: boolean;
  money: (n: number) => string;
  dayLabel: (v: string) => string;
  monthLabel: (v: string) => string;
  cycleDays: (salaryDate: string) => { start: Date; end: Date };
  expectoPatronumImg: string;
  onOpenAddExpense: () => void;
  onOpenEditSalary: () => void;
  onDeleteSalary: () => void;
  onOpenSheetsModal: () => void;
  onDownloadCsv: () => void;
  onPrintPdf: () => void;
  onNavigate: (view: "dashboard" | "expenses" | "analytics" | "budgets" | "history" | "users" | "sheets") => void;
  getCategoryIcon: (cat: string) => React.ReactNode;
  getPaymentIcon: (pay: string) => React.ReactNode;
  StatCard: React.ComponentType<{ icon: React.ReactNode; label: string; value: string; isLight?: boolean }>;
  BudgetCard: React.ComponentType<{ label: string; value: number; budget: number; tone: string; isLight?: boolean }>;
};

export default function OverviewView({
  cycle,
  stats,
  alertItems,
  isLight,
  money,
  dayLabel,
  monthLabel,
  cycleDays,
  expectoPatronumImg,
  onOpenAddExpense,
  onOpenEditSalary,
  onDeleteSalary,
  onOpenSheetsModal,
  onDownloadCsv,
  onPrintPdf,
  onNavigate,
  getCategoryIcon,
  getPaymentIcon,
  StatCard,
  BudgetCard,
}: OverviewViewProps) {
  const recentExpenses = [...stats.expenses].reverse().slice(0, 5);

  return (
    <>
      {/* Active Cycle Header */}
      <section
        className="cycle-heading anim-fade-up anim-delay-1"
        style={{
          background: isLight
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 243, 235, 0.95))"
            : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "20px 26px",
          borderRadius: "16px",
          border: isLight ? "1.5px solid rgba(184, 106, 60, 0.3)" : "1.5px solid rgba(198, 116, 68, 0.35)",
          boxShadow: isLight
            ? "0 12px 35px rgba(80, 50, 30, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
            : "0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          marginBottom: "24px",
        }}
      >
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "6px", color: isLight ? "#8c5230" : "#e59b6e" }}>
            <CalendarDays size={14} /> Active salary cycle · {dayLabel(cycle.salaryDate)} → {dayLabel(cycleDays(cycle.salaryDate).end.toISOString().slice(0, 10))}
          </p>
          <h2 style={{ fontSize: "1.5rem", marginTop: "4px", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>
            {monthLabel(cycle.month)} <span style={{ fontSize: "0.95rem", color: isLight ? "#6e5445" : "#dfc7b5", fontWeight: "normal" }}>/{cycle.notes || "Overview Dashboard"}</span>
          </h2>
        </div>
        <div className="cycle-actions">
          <div className="export-actions">
            <button className="button export" onClick={onOpenSheetsModal} title="Link & Sync Google Sheets" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <FileSpreadsheet size={14} /> Sheets
            </button>
            <button className="button export" onClick={onDownloadCsv} title="Download CSV report">CSV</button>
            <button className="button export" onClick={onPrintPdf} title="Print or save as PDF">PDF</button>
            <button className="button export" onClick={onOpenEditSalary} title="Edit cycle"><Edit3 size={14} /></button>
            <button className="button export" onClick={onDeleteSalary} title="Delete cycle"><Trash2 size={14} /></button>
          </div>
          <button
            className="button primary record-btn"
            onClick={onOpenAddExpense}
            style={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
              color: "#ffffff",
              boxShadow: "0 6px 18px rgba(184, 106, 60, 0.35)",
              border: "none",
            }}
          >
            <Plus size={16} /> Record expense
          </button>
        </div>
      </section>

      {/* Alerts */}
      <section className="alerts anim-fade-up anim-delay-2">
        {alertItems.map((a, i) => (
          <div className={`alert ${a.tone}`} key={i}>
            <div className="alert-icon">
              {a.tone === "olive" ? <Check size={16} /> : a.tone === "amber" ? <Bell size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div>
              <strong>{a.title}</strong>
              <p>{a.detail}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Hero & Quick Stat Cards */}
      <section className="dashboard-grid anim-fade-up anim-delay-3">
        <div
          className="ledger-panel hero-card"
          style={{
            background: isLight
              ? `linear-gradient(135deg, rgba(240, 249, 255, 0.95), rgba(254, 243, 199, 0.95)), url(${expectoPatronumImg})`
              : `linear-gradient(135deg, rgba(10, 18, 30, 0.82), rgba(27, 15, 9, 0.88)), url(${expectoPatronumImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "18px",
            padding: "28px 32px",
            color: isLight ? "#0c4a6e" : "#fff",
            border: isLight ? "1.5px solid rgba(56, 189, 248, 0.6)" : "1.5px solid rgba(56, 189, 248, 0.4)",
            boxShadow: isLight ? "0 18px 45px rgba(14, 165, 233, 0.12)" : "0 25px 60px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div className="panel-kicker">
            <span style={{ color: isLight ? "#0369a1" : "#7dd3fc", letterSpacing: ".16em", fontSize: "11px", fontWeight: 700 }}>EXPECTO PATRONUM · CYCLE PULSE</span>
            <span className="stamp live-pulse" style={{ background: isLight ? "rgba(2, 132, 199, 0.15)" : "rgba(56, 189, 248, 0.25)", color: isLight ? "#0284c7" : "#e0f2fe", border: isLight ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(125, 211, 252, 0.4)", borderRadius: "6px" }}>Live</span>
          </div>
          <div className="hero-balance" style={{ margin: "20px 0" }}>
            <div>
              <small style={{ color: isLight ? "#0369a1" : "#bae6fd", textTransform: "uppercase", letterSpacing: ".1em", fontSize: "11px", fontWeight: 700 }}>Remaining balance</small>
              <strong style={{ color: isLight ? "#0c4a6e" : "#fff", fontSize: "clamp(34px, 5.5vw, 62px)", textShadow: isLight ? "none" : "0 4px 20px rgba(14, 165, 233, 0.5)", display: "block" }}>{money(stats?.remaining || 0)}</strong>
              <span style={{ color: isLight ? "#075985" : "#e0f2fe", fontSize: "12px" }}>{money(stats?.total || 0)} spent from {money(stats?.available || 0)}</span>
            </div>
            <Wallet className="hero-wallet-icon" size={52} strokeWidth={1.2} style={{ color: isLight ? "#0284c7" : "#7dd3fc", filter: isLight ? "drop-shadow(0 4px 12px rgba(2, 132, 199, 0.3))" : "drop-shadow(0 4px 16px rgba(56, 189, 248, 0.6))" }} />
          </div>
          <div className="progress-track" style={{ height: "10px", background: isLight ? "rgba(2, 132, 199, 0.15)" : "rgba(255, 255, 255, 0.14)", borderRadius: "12px", margin: "20px 0 12px" }}>
            <div style={{ width: `${Math.min(100, ((stats?.total || 0) / Math.max(1, stats?.available || 1)) * 100)}%`, background: "linear-gradient(90deg, #0284c7, #38bdf8)", borderRadius: "12px" }} />
          </div>
          <div className="hero-foot" style={{ color: isLight ? "#075985" : "#e0f2fe", fontSize: "12px" }}>
            <span><i className="legend copper" style={{ background: "#38bdf8" }} /> Spent {Math.round(((stats?.total || 0) / Math.max(1, stats?.available || 1)) * 100)}%</span>
            <span><i className="legend olive" style={{ background: isLight ? "#cbd5e1" : "#f0e2d3" }} /> Available {money(stats?.remaining || 0)}</span>
          </div>
        </div>

        <div className="summary-stack">
          <StatCard icon={<CircleDollarSign size={22} />} label="Salary" value={money(cycle.salary)} isLight={isLight} />
          <StatCard icon={<ArrowUpRight size={22} />} label="Existing balance" value={money(cycle.balance)} isLight={isLight} />
          <StatCard icon={<ArrowDownRight size={22} />} label="Total expenses" value={money(stats?.total || 0)} isLight={isLight} />
        </div>
      </section>

      {/* Budget Snapshot Row */}
      <section className="budget-row anim-fade-up anim-delay-4" style={{ marginBottom: "24px" }}>
        <BudgetCard label="Today" value={stats?.todayTotal || 0} budget={cycle.budgets.daily} tone="copper" isLight={isLight} />
        <BudgetCard label="This week" value={stats?.weekTotal || 0} budget={cycle.budgets.weekly} tone="olive" isLight={isLight} />
        <BudgetCard label="This month" value={stats?.total || 0} budget={cycle.budgets.monthly} tone="terracotta" isLight={isLight} />
      </section>

      {/* Two-Column Dashboard Overview */}
      <section className="lower-grid anim-fade-up anim-delay-5">
        {/* Left Column: Recent Expenses Preview */}
        <div
          className="panel table-panel"
          style={{
            background: isLight
              ? "rgba(255, 255, 255, 0.95)"
              : "linear-gradient(145deg, rgba(24, 6, 14, 0.94) 0%, rgba(14, 3, 8, 0.96) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "18px",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(225, 29, 72, 0.45)",
            boxShadow: isLight
              ? "0 14px 40px rgba(80, 50, 30, 0.07)"
              : "0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(225, 29, 72, 0.16)",
          }}
        >
          <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="eyebrow" style={{ color: isLight ? "#dc2626" : "#ff3366", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🩸</span> Recent Activity
              </p>
              <h3 style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", textShadow: isLight ? "none" : "0 0 12px rgba(225, 29, 72, 0.35)" }}>
                Latest Expenses
              </h3>
            </div>
            <button
              className="button primary"
              onClick={onOpenAddExpense}
              style={{
                borderRadius: "10px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #e11d48, #881337)",
                color: "#fff",
                border: "1px solid rgba(255, 100, 130, 0.45)",
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {recentExpenses.length > 0 ? (
            <div className="table-wrap" style={{ marginTop: "12px" }}>
              <table>
                <thead>
                  <tr style={{ background: isLight ? "rgba(240, 230, 220, 0.6)" : "linear-gradient(90deg, rgba(76, 10, 30, 0.95), rgba(45, 6, 18, 0.95))" }}>
                    <th style={{ color: isLight ? "#6e4228" : "#fda4af" }}>Date</th>
                    <th style={{ color: isLight ? "#6e4228" : "#fda4af" }}>Expense</th>
                    <th style={{ color: isLight ? "#6e4228" : "#fda4af" }}>Category</th>
                    <th style={{ color: isLight ? "#6e4228" : "#fda4af" }}>Payment</th>
                    <th style={{ color: isLight ? "#6e4228" : "#fda4af", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(e => (
                    <tr key={e.id} style={{ borderBottom: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(225, 29, 72, 0.16)" }}>
                      <td style={{ color: isLight ? "#4a3528" : "#fff1f2", fontSize: "12px" }}>{dayLabel(e.date)}</td>
                      <td>
                        <strong style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "13px" }}>{e.name}</strong>
                      </td>
                      <td>
                        <span
                          className="tag"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            background: isLight ? "rgba(184, 106, 60, 0.12)" : "linear-gradient(135deg, rgba(136, 19, 55, 0.8), rgba(76, 5, 25, 0.8))",
                            color: isLight ? "#8c4c28" : "#ffe4e6",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {getCategoryIcon(e.category)} {e.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: isLight ? "#5c3c26" : "#fda4af", fontSize: "12px", fontWeight: 600 }}>
                          {getPaymentIcon(e.payment)} {e.payment}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", color: isLight ? "#dc2626" : "#ff3366", fontSize: "14px", fontWeight: 800 }}>
                        {money(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-table" style={{ padding: "30px 16px", textAlign: "center" }}>
              <Receipt size={28} style={{ color: isLight ? "#b86a3c" : "#e11d48", margin: "0 auto 8px" }} />
              <strong style={{ color: isLight ? "#1f1610" : "#ffffff", display: "block" }}>No entries recorded yet</strong>
              <p style={{ color: isLight ? "#7a5c48" : "#fda4af", fontSize: "12px", margin: "4px 0 12px" }}>Record your daily expenses to see activity here.</p>
              <button
                className="button primary"
                onClick={onOpenAddExpense}
                style={{ background: "linear-gradient(135deg, #b86a3c, #8c4c28)", color: "#fff", border: "none", borderRadius: "10px", padding: "6px 14px", fontSize: "12px" }}
              >
                Record first expense
              </button>
            </div>
          )}

          {/* Action button to open full Expenses page */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: isLight ? "1px solid rgba(184, 106, 60, 0.15)" : "1px solid rgba(225, 29, 72, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: isLight ? "#7a5c48" : "#fda4af" }}>
              {stats.expenses.length} total transaction{stats.expenses.length !== 1 ? "s" : ""} recorded
            </span>
            <button
              onClick={() => onNavigate("expenses")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                color: isLight ? "#b86a3c" : "#ff6b8b",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              Open Full Expense Ledger <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Category Mix & Navigation Teasers */}
        <div className="side-column">
          {/* Top Category Mix */}
          <div
            className="panel category-panel"
            style={{
              background: isLight
                ? "rgba(255, 255, 255, 0.95)"
                : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "18px",
              border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(198, 116, 68, 0.35)",
              boxShadow: isLight
                ? "0 10px 30px rgba(80, 50, 30, 0.06)"
                : "0 14px 35px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
              marginBottom: "20px",
            }}
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Where it goes</p>
                <h3 style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff" }}>Category Mix</h3>
              </div>
            </div>
            {stats?.byCategory.length ? (
              <div className="category-list">
                {stats.byCategory.slice(0, 4).map((x, i) => {
                  const pct = Math.round((x.value / Math.max(1, stats.total)) * 100);
                  return (
                    <div className="category-line" key={x.category} style={{ marginBottom: "14px" }}>
                      <div>
                        <span className={`category-dot dot-${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                          {getCategoryIcon(x.category)}
                        </span>
                        <strong style={{ marginLeft: "8px", color: isLight ? "#1f1610" : "#ffffff", fontSize: "13px" }}>{x.category}</strong>
                        <span style={{ fontSize: "10px", padding: "2px 6px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", color: "#fff", borderRadius: "6px", fontWeight: 800, marginLeft: "auto" }}>{pct}%</span>
                        <em style={{ marginLeft: "8px", color: isLight ? "#5c3c26" : "#dfc7b5", fontWeight: 700, fontSize: "12px" }}>{money(x.value)}</em>
                      </div>
                      <div className="mini-track" style={{ height: "6px", marginTop: "6px", borderRadius: "10px", background: isLight ? "#eee3d8" : "rgba(255, 255, 255, 0.12)" }}>
                        <i style={{ width: `${pct}%`, borderRadius: "10px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted" style={{ color: isLight ? "#6e5445" : "#dfc7b5", fontSize: "12px" }}>Category detail will develop as you record the month.</p>
            )}

            <button
              onClick={() => onNavigate("analytics")}
              style={{
                marginTop: "12px",
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: isLight ? "rgba(184, 106, 60, 0.08)" : "rgba(198, 116, 68, 0.12)",
                border: isLight ? "1px solid rgba(184, 106, 60, 0.25)" : "1px solid rgba(198, 116, 68, 0.3)",
                color: isLight ? "#b86a3c" : "#e59b6e",
                fontWeight: 700,
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <BarChart3 size={14} /> View Full Analytics Breakdown <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Budgets Link Card */}
          <div
            className="panel history-tease"
            style={{
              background: isLight
                ? "rgba(255, 255, 255, 0.95)"
                : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "18px",
              border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(198, 116, 68, 0.35)",
              boxShadow: isLight
                ? "0 10px 30px rgba(80, 50, 30, 0.06)"
                : "0 14px 35px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
            }}
          >
            <div>
              <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Allowances</p>
              <h3 style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "1.2rem" }}>Budget Controls</h3>
            </div>
            <p style={{ color: isLight ? "#6e5445" : "#dfc7b5", fontSize: "12px", margin: "6px 0 12px" }}>
              Daily budget: {money(cycle.budgets.daily)} · Weekly: {money(cycle.budgets.weekly)} · Monthly: {money(cycle.budgets.monthly)}
            </p>
            <button
              className="text-button"
              onClick={() => onNavigate("budgets")}
              style={{ color: isLight ? "#b86a3c" : "#e59b6e", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700 }}
            >
              <Target size={14} /> Open budget controls <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
