import React from "react";
import "./ExpensesView.css";
import {
  Plus, Search, Filter, Edit3, Trash2, ClipboardList, Download, Printer,
  FileSpreadsheet, X, Tag
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

type ExpensesViewProps = {
  cycle: Cycle;
  expenses: Expense[];
  filtered: Expense[];
  filters: { search: string; category: string; payment: string };
  onSetFilters: (f: { search: string; category: string; payment: string }) => void;
  onOpenAddExpense: () => void;
  onEditExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onDownloadCsv: () => void;
  onPrintPdf: () => void;
  onOpenSheetsModal: () => void;
  isLight: boolean;
  money: (n: number) => string;
  dayLabel: (v: string) => string;
  monthLabel: (v: string) => string;
  getCategoryIcon: (cat: string) => React.ReactNode;
  getPaymentIcon: (pay: string) => React.ReactNode;
  CATEGORIES: string[];
  PAYMENTS: string[];
};

export default function ExpensesView({
  cycle,
  expenses,
  filtered,
  filters,
  onSetFilters,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  onDownloadCsv,
  onPrintPdf,
  onOpenSheetsModal,
  isLight,
  money,
  dayLabel,
  monthLabel,
  getCategoryIcon,
  getPaymentIcon,
  CATEGORIES,
  PAYMENTS,
}: ExpensesViewProps) {
  const filteredTotal = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const hasActiveFilters = Boolean(filters.search || filters.category || filters.payment);

  const clearFilters = () => {
    onSetFilters({ search: "", category: "", payment: "" });
  };

  return (
    <div className="expenses-view-container anim-fade-up">
      {/* Top Banner / Actions */}
      <section className="expenses-banner">
        <div>
          <p className="eyebrow" style={{ color: isLight ? "#dc2626" : "#ff3366", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <span>💳</span> Full Expense Ledger · {monthLabel(cycle.month)}
          </p>
          <h2 className="expenses-banner-title">
            Expense Register
          </h2>
          <p className="expenses-banner-subtitle">
            Filter, search, edit, and organize all your recorded transactions for this month.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="button export"
            onClick={onOpenSheetsModal}
            title="Link & Sync Google Sheets"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "10px", padding: "8px 14px" }}
          >
            <FileSpreadsheet size={15} /> Sheets
          </button>
          <button
            className="button export"
            onClick={onDownloadCsv}
            title="Download CSV report"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "10px", padding: "8px 14px" }}
          >
            <Download size={15} /> CSV
          </button>
          <button
            className="button export"
            onClick={onPrintPdf}
            title="Print or save as PDF"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "10px", padding: "8px 14px" }}
          >
            <Printer size={15} /> PDF
          </button>
          <button
            className="button primary"
            onClick={onOpenAddExpense}
            style={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #e11d48, #881337)",
              color: "#ffffff",
              boxShadow: "0 6px 18px rgba(225, 29, 72, 0.4)",
              border: "none",
              padding: "9px 20px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> Record expense
          </button>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="expenses-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Search Box */}
          <div className="expenses-search-input-box">
            <Search size={16} style={{ color: isLight ? "#8c5230" : "#fda4af", marginRight: "8px" }} />
            <input
              className="expenses-search-input"
              placeholder="Search by expense name or notes..."
              value={filters.search}
              onChange={e => onSetFilters({ ...filters, search: e.target.value })}
            />
            {filters.search && (
              <button
                onClick={() => onSetFilters({ ...filters, search: "" })}
                style={{ background: "transparent", border: "none", color: isLight ? "#8c5230" : "#fda4af", cursor: "pointer", padding: "2px" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Method Selector */}
          <div style={{ flex: "0 0 180px" }}>
            <select
              className="expenses-payment-select"
              value={filters.payment}
              onChange={e => onSetFilters({ ...filters, payment: e.target.value })}
            >
              <option value="">All Payments</option>
              {PAYMENTS.map(x => (
                <option key={x} value={x} style={{ background: isLight ? "#ffffff" : "#18050d", color: isLight ? "#1f1610" : "#ffffff" }}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: isLight ? "rgba(220, 38, 38, 0.1)" : "rgba(225, 29, 72, 0.2)",
                border: isLight ? "1px solid rgba(220, 38, 38, 0.3)" : "1px solid rgba(225, 29, 72, 0.4)",
                color: isLight ? "#dc2626" : "#fda4af",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <X size={14} /> Clear filters
            </button>
          )}

          {/* Summary Count Pill */}
          <div style={{ marginLeft: "auto", fontSize: "13px", color: isLight ? "#7a5c48" : "#fda4af", fontWeight: 600 }}>
            Showing <strong>{filtered.length}</strong> of <strong>{expenses.length}</strong> · Spend: <strong style={{ color: isLight ? "#dc2626" : "#ff3366" }}>{money(filteredTotal)}</strong>
          </div>
        </div>

        {/* Category Filter Pills Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px", paddingTop: "12px", borderTop: isLight ? "1px solid rgba(184, 106, 60, 0.12)" : "1px solid rgba(225, 29, 72, 0.18)" }}>
          <button
            className={`category-pill-btn ${!filters.category ? "active" : ""}`}
            onClick={() => onSetFilters({ ...filters, category: "" })}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => {
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                className={`category-pill-btn ${isSelected ? "active" : ""}`}
                onClick={() => onSetFilters({ ...filters, category: isSelected ? "" : cat })}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Full-Width Expenses Table Panel */}
      <section className="expenses-table-panel">
        {filtered.length ? (
          <div className="table-wrap">
            <table className="expenses-main-table">
              <thead>
                <tr style={{ background: isLight ? "rgba(240, 230, 220, 0.65)" : "linear-gradient(90deg, rgba(76, 10, 30, 0.95), rgba(45, 6, 18, 0.95))" }}>
                  <th>Date</th>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: isLight ? "#38281d" : "#fff1f2", fontSize: "13px", whiteSpace: "nowrap" }}>
                      {dayLabel(e.date)}
                    </td>
                    <td>
                      <strong style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "14px" }}>{e.name}</strong>
                    </td>
                    <td>
                      <span
                        className="tag"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          background: isLight ? "rgba(184, 106, 60, 0.12)" : "linear-gradient(135deg, rgba(136, 19, 55, 0.8), rgba(76, 5, 25, 0.8))",
                          color: isLight ? "#8c4c28" : "#ffe4e6",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "12px",
                          border: isLight ? "1px solid rgba(184, 106, 60, 0.25)" : "1px solid rgba(244, 63, 94, 0.4)",
                        }}
                      >
                        {getCategoryIcon(e.category)} {e.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: isLight ? "#5c3c26" : "#fda4af", fontWeight: 600, fontSize: "13px" }}>
                        {getPaymentIcon(e.payment)} {e.payment}
                      </span>
                    </td>
                    <td className="amount" style={{ color: isLight ? "#dc2626" : "#ff3366", fontSize: "15px", fontWeight: 800 }}>
                      {money(e.amount)}
                    </td>
                    <td>
                      <span style={{ color: isLight ? "#6e5445" : "#fda4af", fontSize: "12px", maxWidth: "250px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.notes}>
                        {e.notes || "—"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button
                          onClick={() => onEditExpense(e)}
                          style={{
                            border: isLight ? "1px solid #fecaca" : "1px solid rgba(225, 29, 72, 0.3)",
                            background: isLight ? "#fef2f2" : "rgba(225, 29, 72, 0.15)",
                            color: isLight ? "#b91c1c" : "#fda4af",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            cursor: "pointer",
                          }}
                          title="Edit expense"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(e.id)}
                          style={{
                            border: isLight ? "1px solid #fecaca" : "1px solid rgba(225, 29, 72, 0.3)",
                            background: isLight ? "#fef2f2" : "rgba(225, 29, 72, 0.15)",
                            color: isLight ? "#b91c1c" : "#fda4af",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            cursor: "pointer",
                          }}
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table" style={{ padding: "48px 24px", textAlign: "center" }}>
            <ClipboardList size={36} style={{ color: isLight ? "#dc2626" : "#e11d48", margin: "0 auto 12px" }} />
            <strong style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "16px", display: "block" }}>
              {hasActiveFilters ? "No matching expenses found" : "No expenses recorded yet"}
            </strong>
            <p style={{ color: isLight ? "#7a5c48" : "#fda4af", margin: "6px 0 16px" }}>
              {hasActiveFilters ? "Try adjusting your search query or category filters." : "Start recording your daily expenses for this salary cycle."}
            </p>
            {hasActiveFilters ? (
              <button
                className="button export"
                onClick={clearFilters}
                style={{ borderRadius: "10px", padding: "8px 18px", fontWeight: 700 }}
              >
                Clear all filters
              </button>
            ) : (
              <button
                className="button primary"
                onClick={onOpenAddExpense}
                style={{ background: "linear-gradient(135deg, #b86a3c, #8c4c28)", color: "#fff", border: "none", borderRadius: "10px", padding: "9px 20px", fontWeight: 700 }}
              >
                Record first expense
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
