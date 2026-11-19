import React from "react";
import "./BudgetsView.css";
import {
  Target, Edit3, CalendarDays, Check, AlertTriangle, Bell, TrendingDown,
  Clock, ArrowRight, ShieldCheck, Zap
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
  isDelete?: number;
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

type BudgetsViewProps = {
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
  dayLabel: (v: string) => string;
  monthLabel: (v: string) => string;
  cycleDays: (salaryDate: string) => { start: Date; end: Date };
  onOpenEditSalary: () => void;
  onNavigateToExpenses: () => void;
};

export default function BudgetsView({
  cycle,
  stats,
  isLight,
  money,
  dayLabel,
  monthLabel,
  cycleDays,
  onOpenEditSalary,
  onNavigateToExpenses,
}: BudgetsViewProps) {
  const { start, end } = cycleDays(cycle.salaryDate);
  const today = new Date();
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(1, Math.min(totalDays, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));
  const remainingDays = Math.max(0, totalDays - elapsedDays);

  const recommendedDaily = remainingDays > 0 ? Math.round(stats.remaining / remainingDays) : 0;
  const actualDailyAvg = elapsedDays > 0 ? Math.round(stats.total / elapsedDays) : 0;

  // Status helper
  const getStatus = (spent: number, budget: number) => {
    if (budget <= 0) return { label: "No Limit Set", color: isLight ? "#64748b" : "#94a3b8", bg: isLight ? "rgba(100, 116, 139, 0.1)" : "rgba(100, 116, 139, 0.2)" };
    const ratio = spent / budget;
    if (ratio > 1) return { label: "Exceeded", color: isLight ? "#dc2626" : "#f87171", bg: isLight ? "rgba(220, 38, 38, 0.12)" : "rgba(220, 38, 38, 0.25)" };
    if (ratio >= 0.8) return { label: "Near Limit", color: isLight ? "#d97706" : "#fbbf24", bg: isLight ? "rgba(217, 119, 6, 0.12)" : "rgba(217, 119, 6, 0.25)" };
    return { label: "Under Budget", color: isLight ? "#16a34a" : "#4ade80", bg: isLight ? "rgba(22, 163, 74, 0.12)" : "rgba(22, 163, 74, 0.25)" };
  };

  const dailyStatus = getStatus(stats.todayTotal, cycle.budgets.daily);
  const weeklyStatus = getStatus(stats.weekTotal, cycle.budgets.weekly);
  const monthlyStatus = getStatus(stats.total, cycle.budgets.monthly);

  return (
    <div className="budgets-view-container anim-fade-up">
      {/* Top Banner */}
      <section className="budgets-banner">
        <div>
          <p className="eyebrow" style={{ color: isLight ? "#16a34a" : "#4ade80", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <span>🎯</span> Spending Controls · {monthLabel(cycle.month)}
          </p>
          <h2 className="budgets-banner-title">
            Budget Allowances & Targets
          </h2>
          <p style={{ color: isLight ? "#6e5445" : "#bbf7d0", fontSize: "13px" }}>
            Cycle period: {dayLabel(cycle.salaryDate)} → {dayLabel(end.toISOString().slice(0, 10))} ({remainingDays} days remaining)
          </p>
        </div>

        <button
          onClick={onOpenEditSalary}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: isLight ? "rgba(22, 163, 74, 0.1)" : "rgba(74, 222, 128, 0.2)",
            border: isLight ? "1px solid rgba(22, 163, 74, 0.3)" : "1px solid rgba(74, 222, 128, 0.4)",
            color: isLight ? "#16a34a" : "#bbf7d0",
            padding: "8px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Edit3 size={15} /> Edit Budget Targets
        </button>
      </section>

      {/* 3 Large Budget Cards Grid */}
      <section className="budgets-grid">
        {/* Daily Budget Card */}
        <div
          className="budget-control-card"
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(28, 16, 12, 0.9), rgba(16, 10, 8, 0.94))",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(249, 115, 22, 0.35)",
            boxShadow: isLight ? "0 10px 30px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: isLight ? "#c2410c" : "#fdba74", fontWeight: 700 }}>Daily Budget</span>
              <h3 style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Today's Spend</h3>
            </div>
            <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, color: dailyStatus.color, background: dailyStatus.bg }}>
              {dailyStatus.label}
            </span>
          </div>

          <div style={{ margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: "2rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{money(stats.todayTotal)}</strong>
              <span style={{ fontSize: "13px", color: isLight ? "#7a5c48" : "#fdba74" }}>limit: {money(cycle.budgets.daily)}</span>
            </div>
            <div style={{ height: "8px", background: isLight ? "#eee3d8" : "rgba(255, 255, 255, 0.12)", borderRadius: "10px", marginTop: "8px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, cycle.budgets.daily > 0 ? (stats.todayTotal / cycle.budgets.daily) * 100 : 0)}%`,
                  height: "100%",
                  background: stats.todayTotal > cycle.budgets.daily ? "linear-gradient(90deg, #f97316, #ef4444)" : "linear-gradient(90deg, #f97316, #fb923c)",
                  borderRadius: "10px",
                }}
              />
            </div>
          </div>

          <div style={{ paddingTop: "12px", borderTop: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: isLight ? "#7a5c48" : "#dfc7b5" }}>Remaining today:</span>
            <strong style={{ color: stats.todayTotal > cycle.budgets.daily ? (isLight ? "#dc2626" : "#f87171") : (isLight ? "#16a34a" : "#4ade80") }}>
              {stats.todayTotal > cycle.budgets.daily ? `Exceeded by ${money(stats.todayTotal - cycle.budgets.daily)}` : `${money(cycle.budgets.daily - stats.todayTotal)} left`}
            </strong>
          </div>
        </div>

        {/* Weekly Budget Card */}
        <div
          className="budget-control-card"
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(16, 24, 16, 0.9), rgba(8, 16, 10, 0.94))",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(74, 222, 128, 0.35)",
            boxShadow: isLight ? "0 10px 30px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: isLight ? "#16a34a" : "#86efac", fontWeight: 700 }}>Weekly Budget</span>
              <h3 style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>This Week</h3>
            </div>
            <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, color: weeklyStatus.color, background: weeklyStatus.bg }}>
              {weeklyStatus.label}
            </span>
          </div>

          <div style={{ margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: "2rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{money(stats.weekTotal)}</strong>
              <span style={{ fontSize: "13px", color: isLight ? "#7a5c48" : "#86efac" }}>limit: {money(cycle.budgets.weekly)}</span>
            </div>
            <div style={{ height: "8px", background: isLight ? "#eee3d8" : "rgba(255, 255, 255, 0.12)", borderRadius: "10px", marginTop: "8px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, cycle.budgets.weekly > 0 ? (stats.weekTotal / cycle.budgets.weekly) * 100 : 0)}%`,
                  height: "100%",
                  background: stats.weekTotal > cycle.budgets.weekly ? "linear-gradient(90deg, #22c55e, #ef4444)" : "linear-gradient(90deg, #22c55e, #4ade80)",
                  borderRadius: "10px",
                }}
              />
            </div>
          </div>

          <div style={{ paddingTop: "12px", borderTop: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: isLight ? "#7a5c48" : "#dfc7b5" }}>Remaining this week:</span>
            <strong style={{ color: stats.weekTotal > cycle.budgets.weekly ? (isLight ? "#dc2626" : "#f87171") : (isLight ? "#16a34a" : "#4ade80") }}>
              {stats.weekTotal > cycle.budgets.weekly ? `Exceeded by ${money(stats.weekTotal - cycle.budgets.weekly)}` : `${money(cycle.budgets.weekly - stats.weekTotal)} left`}
            </strong>
          </div>
        </div>

        {/* Monthly Budget Card */}
        <div
          className="budget-control-card"
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(28, 14, 20, 0.9), rgba(16, 8, 12, 0.94))",
            border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1.5px solid rgba(236, 72, 153, 0.35)",
            boxShadow: isLight ? "0 10px 30px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: isLight ? "#be185d" : "#f472b6", fontWeight: 700 }}>Monthly Target</span>
              <h3 style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Total Month Spend</h3>
            </div>
            <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, color: monthlyStatus.color, background: monthlyStatus.bg }}>
              {monthlyStatus.label}
            </span>
          </div>

          <div style={{ margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: "2rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{money(stats.total)}</strong>
              <span style={{ fontSize: "13px", color: isLight ? "#7a5c48" : "#f472b6" }}>target: {money(cycle.budgets.monthly)}</span>
            </div>
            <div style={{ height: "8px", background: isLight ? "#eee3d8" : "rgba(255, 255, 255, 0.12)", borderRadius: "10px", marginTop: "8px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, cycle.budgets.monthly > 0 ? (stats.total / cycle.budgets.monthly) * 100 : 0)}%`,
                  height: "100%",
                  background: stats.total > cycle.budgets.monthly ? "linear-gradient(90deg, #ec4899, #ef4444)" : "linear-gradient(90deg, #ec4899, #f472b6)",
                  borderRadius: "10px",
                }}
              />
            </div>
          </div>

          <div style={{ paddingTop: "12px", borderTop: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: isLight ? "#7a5c48" : "#dfc7b5" }}>Month target remaining:</span>
            <strong style={{ color: stats.total > cycle.budgets.monthly ? (isLight ? "#dc2626" : "#f87171") : (isLight ? "#16a34a" : "#4ade80") }}>
              {stats.total > cycle.budgets.monthly ? `Over by ${money(stats.total - cycle.budgets.monthly)}` : `${money(cycle.budgets.monthly - stats.total)} left`}
            </strong>
          </div>
        </div>
      </section>

      {/* Burn Rate & Projection Calculator Section */}
      <section className="burn-rate-calculator-panel">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>Burn Rate & Projections</p>
            <h3 style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", margin: "2px 0" }}>Cycle Timeline & Daily Allowance</h3>
          </div>
          <button
            onClick={onNavigateToExpenses}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: isLight ? "1px solid rgba(184, 106, 60, 0.25)" : "1px solid rgba(198, 116, 68, 0.3)",
              color: isLight ? "#b86a3c" : "#e59b6e",
              fontWeight: 700,
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Review all entries <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div className="burn-rate-stat-box" style={{ background: isLight ? "rgba(184, 106, 60, 0.05)" : "rgba(255, 255, 255, 0.03)", border: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(255, 255, 255, 0.06)" }}>
            <span style={{ fontSize: "11px", color: isLight ? "#7a5c48" : "#dfc7b5", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Days Elapsed / Remaining</span>
            <strong style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", display: "block", marginTop: "4px" }}>
              {elapsedDays} / {remainingDays} days
            </strong>
            <small style={{ color: isLight ? "#7a5c48" : "#dfc7b5", fontSize: "11px" }}>Total {totalDays} days in cycle</small>
          </div>

          <div className="burn-rate-stat-box" style={{ background: isLight ? "rgba(184, 106, 60, 0.05)" : "rgba(255, 255, 255, 0.03)", border: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(255, 255, 255, 0.06)" }}>
            <span style={{ fontSize: "11px", color: isLight ? "#7a5c48" : "#dfc7b5", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Actual Daily Average</span>
            <strong style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", display: "block", marginTop: "4px" }}>
              {money(actualDailyAvg)} <span style={{ fontSize: "12px", fontWeight: "normal" }}>/ day</span>
            </strong>
            <small style={{ color: isLight ? "#7a5c48" : "#dfc7b5", fontSize: "11px" }}>based on {money(stats.total)} spent so far</small>
          </div>

          <div className="burn-rate-stat-box" style={{ background: isLight ? "rgba(22, 163, 74, 0.06)" : "rgba(74, 222, 128, 0.08)", border: isLight ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid rgba(74, 222, 128, 0.2)" }}>
            <span style={{ fontSize: "11px", color: isLight ? "#16a34a" : "#86efac", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Safe Daily Burn Limit</span>
            <strong style={{ fontSize: "1.35rem", color: isLight ? "#15803d" : "#4ade80", display: "block", marginTop: "4px" }}>
              {money(recommendedDaily)} <span style={{ fontSize: "12px", fontWeight: "normal" }}>/ day</span>
            </strong>
            <small style={{ color: isLight ? "#16a34a" : "#86efac", fontSize: "11px" }}>to keep {money(stats.remaining)} balance safe</small>
          </div>
        </div>
      </section>
    </div>
  );
}
