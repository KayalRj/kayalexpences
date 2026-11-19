import React from "react";
import {
  BarChart3, PieChart, TrendingUp, CreditCard, Banknote, Zap, Landmark,
  Receipt, ArrowRight, ShieldCheck, AlertTriangle
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

type AnalyticsViewProps = {
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
  isLight: boolean;
  money: (n: number) => string;
  monthLabel: (v: string) => string;
  getCategoryIcon: (cat: string) => React.ReactNode;
  getPaymentIcon: (pay: string) => React.ReactNode;
  onNavigateToExpenses: () => void;
};

export default function AnalyticsView({
  cycle,
  stats,
  isLight,
  money,
  monthLabel,
  getCategoryIcon,
  getPaymentIcon,
  onNavigateToExpenses,
}: AnalyticsViewProps) {
  // Compute payment method breakdowns
  const paymentBreakdown = React.useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    stats.expenses.forEach(e => {
      const pay = e.payment || "Other";
      if (!map[pay]) map[pay] = { total: 0, count: 0 };
      map[pay].total += Number(e.amount) || 0;
      map[pay].count += 1;
    });
    return Object.entries(map).map(([payment, data]) => ({
      payment,
      total: data.total,
      count: data.count,
      pct: stats.total > 0 ? Math.round((data.total / stats.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [stats.expenses, stats.total]);

  // Top category
  const topCategory = stats.byCategory.length > 0 ? stats.byCategory[0] : null;
  const avgExpense = stats.expenses.length > 0 ? Math.round(stats.total / stats.expenses.length) : 0;
  const topPayment = paymentBreakdown.length > 0 ? paymentBreakdown[0] : null;

  return (
    <div className="analytics-page-view anim-fade-up">
      {/* Top Banner */}
      <section
        style={{
          background: isLight
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 244, 238, 0.96))"
            : "linear-gradient(135deg, rgba(24, 14, 28, 0.92), rgba(14, 8, 20, 0.96))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "18px",
          padding: "24px 28px",
          border: isLight ? "1.5px solid rgba(184, 106, 60, 0.3)" : "1.5px solid rgba(168, 85, 247, 0.4)",
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
          <p className="eyebrow" style={{ color: isLight ? "#9333ea" : "#c084fc", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <span>📈</span> Spending Analytics · {monthLabel(cycle.month)}
          </p>
          <h2 style={{ fontSize: "1.75rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800, margin: "4px 0" }}>
            Category & Channel Insights
          </h2>
          <p style={{ color: isLight ? "#6e5445" : "#e9d5ff", fontSize: "13px" }}>
            Detailed breakdown of spending distributions, payment types, and burn patterns.
          </p>
        </div>

        <button
          onClick={onNavigateToExpenses}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: isLight ? "rgba(147, 51, 234, 0.1)" : "rgba(168, 85, 247, 0.2)",
            border: isLight ? "1px solid rgba(147, 51, 234, 0.3)" : "1px solid rgba(168, 85, 247, 0.4)",
            color: isLight ? "#9333ea" : "#e9d5ff",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Receipt size={15} /> View Expense Ledger <ArrowRight size={14} />
        </button>
      </section>

      {/* Top 3 Summary Metric Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Top Category Card */}
        <div
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(24, 12, 18, 0.88)",
            padding: "20px 22px",
            borderRadius: "16px",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(244, 63, 94, 0.35)",
            boxShadow: isLight ? "0 8px 24px rgba(80, 50, 30, 0.05)" : "0 10px 30px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", color: isLight ? "#8c5230" : "#fda4af", fontWeight: 700 }}>
              Top Spending Category
            </span>
            {topCategory && (
              <span style={{ padding: "4px", borderRadius: "6px", background: isLight ? "rgba(225, 29, 72, 0.1)" : "rgba(225, 29, 72, 0.25)", color: isLight ? "#e11d48" : "#fda4af" }}>
                {getCategoryIcon(topCategory.category)}
              </span>
            )}
          </div>
          <strong style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", display: "block" }}>
            {topCategory ? topCategory.category : "None"}
          </strong>
          <span style={{ fontSize: "12px", color: isLight ? "#dc2626" : "#ff3366", fontWeight: 700 }}>
            {topCategory ? `${money(topCategory.value)} (${Math.round((topCategory.value / Math.max(1, stats.total)) * 100)}%)` : "No expenses"}
          </span>
        </div>

        {/* Average Transaction Card */}
        <div
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(18, 16, 28, 0.88)",
            padding: "20px 22px",
            borderRadius: "16px",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(168, 85, 247, 0.35)",
            boxShadow: isLight ? "0 8px 24px rgba(80, 50, 30, 0.05)" : "0 10px 30px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", color: isLight ? "#7c3aed" : "#c084fc", fontWeight: 700 }}>
              Average Spend
            </span>
            <TrendingUp size={16} style={{ color: isLight ? "#7c3aed" : "#c084fc" }} />
          </div>
          <strong style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", display: "block" }}>
            {money(avgExpense)}
          </strong>
          <span style={{ fontSize: "12px", color: isLight ? "#6e5445" : "#e9d5ff" }}>
            across {stats.expenses.length} transaction{stats.expenses.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Most Used Payment Channel */}
        <div
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(12, 22, 28, 0.88)",
            padding: "20px 22px",
            borderRadius: "16px",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(56, 189, 248, 0.35)",
            boxShadow: isLight ? "0 8px 24px rgba(80, 50, 30, 0.05)" : "0 10px 30px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", color: isLight ? "#0284c7" : "#7dd3fc", fontWeight: 700 }}>
              Primary Payment Channel
            </span>
            {topPayment && (
              <span style={{ padding: "4px", borderRadius: "6px", background: isLight ? "rgba(2, 132, 199, 0.1)" : "rgba(56, 189, 248, 0.25)", color: isLight ? "#0284c7" : "#7dd3fc" }}>
                {getPaymentIcon(topPayment.payment)}
              </span>
            )}
          </div>
          <strong style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", display: "block" }}>
            {topPayment ? topPayment.payment : "None"}
          </strong>
          <span style={{ fontSize: "12px", color: isLight ? "#0284c7" : "#7dd3fc", fontWeight: 700 }}>
            {topPayment ? `${money(topPayment.total)} (${topPayment.pct}%)` : "No activity"}
          </span>
        </div>
      </section>

      {/* Two-Column Analytics Layout */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* Left Column: Full Category Mix */}
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
            <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Expense Distribution</p>
            <h3 style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Category Breakdown</h3>
            <span style={{ fontSize: "12px", color: isLight ? "#6e5445" : "#dfc7b5" }}>
              All categories sorted by total money spent this cycle
            </span>
          </div>

          {stats.byCategory.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {stats.byCategory.map((x, i) => {
                const pct = Math.round((x.value / Math.max(1, stats.total)) * 100);
                const count = stats.expenses.filter(e => e.category === x.category).length;
                return (
                  <div key={x.category} style={{ background: isLight ? "rgba(184, 106, 60, 0.04)" : "rgba(255, 255, 255, 0.03)", padding: "12px 14px", borderRadius: "12px", border: isLight ? "1px solid rgba(184, 106, 60, 0.1)" : "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className={`category-dot dot-${i % 5}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                          {getCategoryIcon(x.category)}
                        </span>
                        <div>
                          <strong style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "14px", display: "block" }}>{x.category}</strong>
                          <span style={{ fontSize: "11px", color: isLight ? "#7a5c48" : "#dfc7b5" }}>{count} transaction{count !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "14px", display: "block" }}>{money(x.value)}</strong>
                        <span style={{ fontSize: "11px", color: isLight ? "#b86a3c" : "#e59b6e", fontWeight: 700 }}>{pct}% of spend</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ height: "7px", background: isLight ? "#eee3d8" : "rgba(255, 255, 255, 0.12)", borderRadius: "10px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: "10px",
                          background: "linear-gradient(90deg, #b86a3c, #e11d48)",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <p style={{ color: isLight ? "#6e5445" : "#dfc7b5", fontSize: "13px" }}>No category spending recorded for this cycle yet.</p>
            </div>
          )}
        </div>

        {/* Right Column: Payment Channels & Tips */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Payment Methods Card */}
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
              <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Payment Channels</p>
              <h3 style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Payment Methods</h3>
              <span style={{ fontSize: "12px", color: isLight ? "#6e5445" : "#dfc7b5" }}>
                How you paid for your transactions
              </span>
            </div>

            {paymentBreakdown.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {paymentBreakdown.map(p => (
                  <div key={p.payment} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "10px", background: isLight ? "rgba(184, 106, 60, 0.04)" : "rgba(255, 255, 255, 0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ padding: "6px", borderRadius: "8px", background: isLight ? "rgba(184, 106, 60, 0.12)" : "rgba(255, 255, 255, 0.1)", color: isLight ? "#b86a3c" : "#dfc7b5" }}>
                        {getPaymentIcon(p.payment)}
                      </span>
                      <div>
                        <strong style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "13px" }}>{p.payment}</strong>
                        <small style={{ color: isLight ? "#7a5c48" : "#dfc7b5", display: "block", fontSize: "11px" }}>{p.count} transaction{p.count !== 1 ? "s" : ""}</small>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "13px", fontWeight: 700, display: "block" }}>{money(p.total)}</span>
                      <span style={{ fontSize: "11px", color: isLight ? "#b86a3c" : "#e59b6e", fontWeight: 700 }}>{p.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: isLight ? "#6e5445" : "#dfc7b5", fontSize: "12px" }}>No payment data recorded yet.</p>
            )}
          </div>

          {/* Spending Insights Card */}
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
              <ShieldCheck size={18} style={{ color: isLight ? "#16a34a" : "#4ade80" }} />
              <h3 style={{ fontSize: "1.2rem", color: isLight ? "#1f1610" : "#ffffff", margin: 0 }}>Financial Health Note</h3>
            </div>
            <p style={{ color: isLight ? "#5c3c26" : "#dfc7b5", fontSize: "13px", lineHeight: "1.6" }}>
              {stats.total > cycle.salary ? (
                <span style={{ color: isLight ? "#dc2626" : "#f87171" }}>
                  ⚠️ Your total expenses have exceeded your salary amount for this month. Focus on reducing discretionary categories like Shopping or Entertainment.
                </span>
              ) : stats.remaining > 0 ? (
                <span>
                  ✅ You are maintaining a healthy surplus of <strong>{money(stats.remaining)}</strong>. Keep recording your daily entries to maintain budget discipline!
                </span>
              ) : (
                <span>
                  Budget is actively tracking. Check your daily and weekly limits to ensure you remain within planned limits.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
