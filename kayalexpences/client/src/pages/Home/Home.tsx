/* Copper Ledger design: warm parchment surfaces, burnished copper actions, editorial numbers, asymmetric workspace. */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, BarChart3, Bell, CalendarDays, Car, Check, ChevronRight, CircleDollarSign, ClipboardList, CreditCard, Edit3, ExternalLink, FileSpreadsheet, Film, Filter, GraduationCap, HeartPulse, Home as HomeIcon, Landmark, LayoutDashboard, Lock, LogOut, Menu, Moon, Plus, Quote, Receipt, Search, Settings2, ShieldCheck, ShoppingBag, Smartphone, Sun, Tag, Target, Trash2, TrendingUp, User, Users, Utensils, Wallet, X, Zap } from "lucide-react";
import GoogleSheetsModal from "../../components/GoogleSheetsModal";
import ProfileModal from "../../components/ProfileModal";
import UserManagement from "../../components/UserManagement";
import OverviewView from "./components/OverviewView";
import ExpensesView from "./components/ExpensesView";
import AnalyticsView from "./components/AnalyticsView";
import BudgetsView from "./components/BudgetsView";
import GoogleSheetsView from "./components/GoogleSheetsView";
import { getGoogleSheetsConfig, GoogleSheetsConfig, syncSingleExpenseToGoogleSheets } from "../../lib/googleSheets";
import { expenseService, salaryCycleService } from "../../services";
import kayalLogo from "../../Assects/kayallogo2.png";
import hatImg from "../../Assects/hat.jpg";
import hogbgImg from "../../Assects/hogbg.jpg";
import polujuiceImg from "../../Assects/polujuice.jpg";
import platformImg from "../../Assects/platform.jpg";
import owlImg from "../../Assects/owl.jpg";
import harryImg from "../../Assects/harry.jpg";
import letterTaklImg from "../../Assects/letter takl.jpg";
import expectoPatronumImg from "../../Assects/expectopetronoum.jpg";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Rent", "Entertainment", "Medical", "Education", "Recharge", "Other"];
const PAYMENTS = ["Cash", "UPI", "Debit Card", "Credit Card", "Bank Transfer"];
const KEY = "kayal-expenses-v3";

function useTransparentImage(src: string, threshold = 175) {
  const [transparentSrc, setTransparentSrc] = useState<string>(src);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Remove white or near-white background pixels
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0; // Transparent alpha
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setTransparentSrc(canvas.toDataURL("image/png"));
    };
    img.src = src;
  }, [src, threshold]);

  return transparentSrc;
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "Food": return <Utensils size={14} />;
    case "Travel": return <Car size={14} />;
    case "Shopping": return <ShoppingBag size={14} />;
    case "Bills": return <Receipt size={14} />;
    case "Rent": return <HomeIcon size={14} />;
    case "Entertainment": return <Film size={14} />;
    case "Medical": return <HeartPulse size={14} />;
    case "Education": return <GraduationCap size={14} />;
    case "Recharge": return <Smartphone size={14} />;
    default: return <Tag size={14} />;
  }
}

function getPaymentIcon(pay: string) {
  switch (pay) {
    case "Cash": return <Banknote size={13} />;
    case "UPI": return <Zap size={13} />;
    case "Debit Card":
    case "Credit Card": return <CreditCard size={13} />;
    case "Bank Transfer": return <Landmark size={13} />;
    default: return <Banknote size={13} />;
  }
}

type Expense = { id: string; date: string; name: string; category: string; amount: number; payment: string; notes: string; valid?: boolean };
type Cycle = { id: string; month: string; salaryDate: string; salary: number; balance: number; notes: string; budgets: { daily: number; weekly: number; monthly: number }; expenses: Expense[] };
type Store = { cycles: Cycle[]; activeId: string | null; lowBalanceThreshold: number };

const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.max(0, n));
const isoToday = () => new Date().toISOString().slice(0, 10);
const monthLabel = (value: string) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(`${value}-01T00:00:00`));
const dayLabel = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
const startOfWeek = (d: Date) => { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - (day === 0 ? 6 : day - 1)); x.setHours(0, 0, 0, 0); return x; };
const cycleDays = (salaryDate: string) => { const d = new Date(`${salaryDate}T00:00:00`); const next = new Date(d); next.setMonth(next.getMonth() + 1); next.setDate(next.getDate() - 1); return { start: d, end: next }; };
const emptyExpense = (date = isoToday()): Expense => ({ id: "", date, name: "", category: "", amount: 0, payment: "", notes: "" });

const initialStore = (): Store => {
  try {
    // Clear old versions and mock test data
    localStorage.removeItem("kayal-expenses-v1");
    localStorage.removeItem("kayal-expenses-v2");

    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: Store = JSON.parse(raw);
      const cleanCycles = (parsed.cycles || [])
        .filter(c => c.id !== "hogwarts-cycle-default")
        .filter(c => !c.expenses?.some(e => 
          e.name === "Supermarket Pantry Essentials" || 
          e.name === "Organic Groceries & Provisions" ||
          e.name === "Office Cafeteria & Coffee" ||
          e.id === "exp-cur-1" ||
          e.id === "h1"
        ))
        .map(c => ({
          ...c,
          expenses: (c.expenses || []).filter(e => !["h1", "h2", "h3", "h4", "exp-cur-1", "exp-cur-2", "exp-cur-3", "exp-cur-4"].includes(e.id))
        }));
      return {
        cycles: cleanCycles,
        activeId: cleanCycles.some(c => c.id === parsed.activeId) ? parsed.activeId : (cleanCycles[0]?.id || null),
        lowBalanceThreshold: parsed.lowBalanceThreshold || 20
      };
    }
  } catch { }
  return { cycles: [], activeId: null, lowBalanceThreshold: 20 };
};

function validExpense(e: Expense, cycle?: Cycle) {
  const { start, end } = cycle ? cycleDays(cycle.salaryDate) : { start: new Date("1900-01-01"), end: new Date("2999-01-01") };
  const d = new Date(`${e.date}T00:00:00`);
  return Boolean(e.date && !Number.isNaN(d.getTime()) && d >= start && d <= end && e.name.trim().length >= 2 && CATEGORIES.includes(e.category) && Number.isFinite(Number(e.amount)) && Number(e.amount) > 0 && PAYMENTS.includes(e.payment) && e.notes.trim().length >= 5 && e.notes.trim().length <= 250);
}
function totals(cycle: Cycle) { const expenses = cycle.expenses.filter(e => e.valid !== false && validExpense(e, cycle)); const total = expenses.reduce((s, e) => s + Number(e.amount), 0); const today = isoToday(); const now = new Date(); const weekStart = startOfWeek(now); const todayTotal = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0); const weekTotal = expenses.filter(e => { const d = new Date(`${e.date}T00:00:00`); return d >= weekStart && d <= now; }).reduce((s, e) => s + e.amount, 0); const byCategory = CATEGORIES.map(category => ({ category, value: expenses.filter(e => e.category === category).reduce((s, e) => s + e.amount, 0) })).filter(x => x.value > 0).sort((a, b) => b.value - a.value); return { expenses, total, todayTotal, weekTotal, byCategory, available: cycle.salary + cycle.balance, remaining: cycle.salary + cycle.balance - total }; }
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
const reportFilename = (cycle: Cycle, extension: string) => `kayal-expenses-${cycle.month}.${extension}`;
function downloadCsv(cycle: Cycle) { const t = totals(cycle); const rows = [["Kayal Expenses Monthly Report", monthLabel(cycle.month)], ["Salary date", cycle.salaryDate], ["Salary", cycle.salary], ["Existing balance", cycle.balance], ["Total available", t.available], ["Total expenses", t.total], ["Remaining balance", t.remaining], [], ["Date", "Expense", "Category", "Payment method", "Amount", "Notes"], ...t.expenses.map(e => [e.date, e.name, e.category, e.payment, e.amount, e.notes])]; const csv = rows.map(row => row.map(cell => csvCell(cell ?? "")).join(",")).join("\\r\\n"); const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = reportFilename(cycle, "csv"); anchor.click(); URL.revokeObjectURL(url); }
function printPdf(cycle: Cycle) { const t = totals(cycle); const rows = t.expenses.map(e => `<tr><td>${dayLabel(e.date)}</td><td>${e.name}</td><td>${e.category}</td><td>${e.payment}</td><td>${money(e.amount)}</td><td>${e.notes}</td></tr>`).join(""); const win = window.open("", "_blank", "width=1000,height=800"); if (!win) return; win.document.write(`<!doctype html><html><head><title>${reportFilename(cycle, "pdf")}</title><style>body{font-family:Arial,sans-serif;color:#3f312b;padding:36px}h1{font-family:Georgia,serif;color:#8d4f2e;margin:0 0 6px}p{color:#806f62}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:26px 0}.summary div{border:1px solid #dfd2c3;padding:12px;background:#fbf8f3}.summary small{display:block;text-transform:uppercase;letter-spacing:.08em;color:#8d7b6e;font-size:10px}.summary strong{display:block;font:24px Georgia,serif;margin-top:5px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{text-align:left;padding:9px 7px;border-bottom:1px solid #e7ded3}th{color:#8d7b6e;text-transform:uppercase;font-size:9px;letter-spacing:.08em}@media print{body{padding:0}.no-print{display:none}}</style></head><body><h1>Kayal Expenses</h1><p>${monthLabel(cycle.month)} Â· Salary cycle beginning ${dayLabel(cycle.salaryDate)}</p><div class="summary"><div><small>Total available</small><strong>${money(t.available)}</strong></div><div><small>Total expenses</small><strong>${money(t.total)}</strong></div><div><small>Remaining balance</small><strong>${money(t.remaining)}</strong></div></div><table><thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Payment</th><th>Amount</th><th>Notes</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No valid expenses recorded for this month.</td></tr>`}</tbody></table><p class="no-print">Use your browser's print dialog and choose â€œSave as PDFâ€.</p></body></html>`); win.document.close(); win.focus(); setTimeout(() => win.print(), 250); }

function getAppBrandName() {
  const sessionEmail = sessionStorage.getItem("kayal_user_email");
  const storedEmail = localStorage.getItem("kayal_user_email");
  const activeEmail = sessionEmail || storedEmail || "kayalvizhiintn@gmail.com";
  let rawPrefix = activeEmail.split("@")[0] || "kayal";
  if (rawPrefix.toLowerCase() === "true" || rawPrefix.toLowerCase() === "false") {
    rawPrefix = "kayal";
  }
  const name = rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);
  return { name, suffix: "Expenses" };
}

export default function Home({
  onLogout,
  theme: propTheme,
  onToggleTheme: propToggleTheme
}: {
  onLogout?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}) {
  const [localTheme, setLocalTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("kayal_theme_mode") as "dark" | "light") || "dark";
  });

  const currentTheme = propTheme || localTheme;
  const isLight = currentTheme === "light";

  const toggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const next = currentTheme === "dark" ? "light" : "dark";
      setLocalTheme(next);
      localStorage.setItem("kayal_theme_mode", next);
      if (next === "light") {
        document.documentElement.classList.add("theme-light");
        document.body.classList.add("theme-light");
      } else {
        document.documentElement.classList.remove("theme-light");
        document.body.classList.remove("theme-light");
      }
    }
  };

  const brand = getAppBrandName();
  const cleanHatImg = useTransparentImage(hatImg);
  const cleanPolujuiceImg = useTransparentImage(polujuiceImg);
  const cleanLetterImg = useTransparentImage(letterTaklImg);
  const [store, setStore] = useState<Store>(initialStore);
  type ViewMode = "dashboard" | "expenses" | "analytics" | "budgets" | "history" | "users" | "sheets";
  const [view, setView] = useState<ViewMode>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getGoogleSheetsConfig);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<Cycle | null>(null);
  const [expense, setExpense] = useState<Expense>(emptyExpense());
  const [salary, setSalary] = useState({ id: "", month: new Date().toISOString().slice(0, 7), salaryDate: isoToday(), salary: "", balance: "", notes: "", daily: "500", weekly: "3500", monthly: "15000" });
  const [filters, setFilters] = useState({ search: "", category: "", payment: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const firstInvalid = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);

  // Sync to local storage
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(store)); }, [store]);

  // Load from PostgreSQL Backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        const cyclesFromDb = await salaryCycleService.getAll();
        if (!isMounted) return;
        if (cyclesFromDb && cyclesFromDb.length > 0) {
          const fullCycles: Cycle[] = await Promise.all(
            cyclesFromDb.map(async (c) => {
              try {
                const exps = await expenseService.getAll({ salaryCycleId: c.id });
                return {
                  id: c.id,
                  month: c.month,
                  salaryDate: c.salaryDate.slice(0, 10),
                  salary: Number(c.salaryAmount),
                  balance: Number(c.existingBalance),
                  notes: c.notes || "",
                  budgets: {
                    daily: Number(c.dailyBudget),
                    weekly: Number(c.weeklyBudget),
                    monthly: Number(c.monthlyBudget),
                  },
                  expenses: exps.map((e) => ({
                    id: e.id,
                    date: e.date.slice(0, 10),
                    name: e.name,
                    category: e.category,
                    amount: Number(e.amount),
                    payment: e.paymentMethod,
                    notes: e.notes || "",
                    valid: true,
                  })),
                };
              } catch {
                return {
                  id: c.id,
                  month: c.month,
                  salaryDate: c.salaryDate.slice(0, 10),
                  salary: Number(c.salaryAmount),
                  balance: Number(c.existingBalance),
                  notes: c.notes || "",
                  budgets: {
                    daily: Number(c.dailyBudget),
                    weekly: Number(c.weeklyBudget),
                    monthly: Number(c.monthlyBudget),
                  },
                  expenses: [],
                };
              }
            })
          );
          const active = cyclesFromDb.find((c) => c.isCurrentCycle) || cyclesFromDb[0];
          setStore((prev) => ({
            ...prev,
            cycles: fullCycles,
            activeId: active ? active.id : prev.activeId,
          }));
        }
      } catch (err) {
        console.warn("Backend API sync on startup:", err);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, []);

  const cycle = store.cycles.find(c => c.id === store.activeId) ?? null;
  const stats = useMemo(() => cycle ? totals(cycle) : null, [cycle]);
  const filtered = useMemo(() => stats?.expenses.filter(e => (!filters.search || `${e.name} ${e.notes}`.toLowerCase().includes(filters.search.toLowerCase())) && (!filters.category || e.category === filters.category) && (!filters.payment || e.payment === filters.payment)) ?? [], [stats, filters]);
  const alertItems = useMemo(() => { if (!cycle || !stats) return []; const out: { tone: string; title: string; detail: string }[] = []; const { start, end } = cycleDays(cycle.salaryDate); const today = new Date(); const inCycle = today >= start && today <= end; if (inCycle && !stats.expenses.some(e => e.date === isoToday())) out.push({ tone: "amber", title: "Daily expense entry pending", detail: "No expense has been recorded for today. Keep the month visible." }); if (stats.todayTotal > cycle.budgets.daily) out.push({ tone: "terracotta", title: "Daily budget exceeded", detail: `You have spent ${money(stats.todayTotal)} today against ${money(cycle.budgets.daily)}.` }); if (stats.weekTotal > cycle.budgets.weekly) out.push({ tone: "terracotta", title: "Weekly budget exceeded", detail: `You are ${money(stats.weekTotal - cycle.budgets.weekly)} over the weekly budget.` }); if (stats.total > cycle.budgets.monthly) out.push({ tone: "terracotta", title: "Monthly budget exceeded", detail: `You are ${money(stats.total - cycle.budgets.monthly)} over the monthly budget.` }); if (stats.available > 0 && stats.remaining / stats.available < store.lowBalanceThreshold / 100) out.push({ tone: "terracotta", title: "Low balance warning", detail: "Your remaining balance is getting low." }); if (!out.length) out.push({ tone: "olive", title: "Budget is under control", detail: "No threshold has been crossed in this salary cycle." }); return out; }, [cycle, stats, store.lowBalanceThreshold]);

  const updateCycle = (next: Cycle) => setStore(s => ({ ...s, cycles: s.cycles.map(c => c.id === next.id ? next : c) }));
  const validate = (e: Expense) => { const errors: Record<string, string> = {}; if (!e.date) errors.date = "Choose a date."; else if (cycle && !validExpense({ ...e, name: e.name || "ok", category: e.category || "Food", amount: e.amount || 1, payment: e.payment || "Cash", notes: e.notes || "valid note" }, cycle)) { const { start, end } = cycleDays(cycle.salaryDate); const d = new Date(`${e.date}T00:00:00`); if (d < start || d > end) errors.date = `Date must be between ${dayLabel(cycle.salaryDate)} and ${dayLabel(end.toISOString().slice(0, 10))}.`; } if (e.name.trim().length < 2) errors.name = "Use at least 2 characters."; if (!CATEGORIES.includes(e.category)) errors.category = "Select a category."; if (!Number.isFinite(Number(e.amount)) || Number(e.amount) <= 0) errors.amount = "Enter an amount greater than â‚¹0."; if (!PAYMENTS.includes(e.payment)) errors.payment = "Select a payment method."; if (e.notes.trim().length < 5) errors.notes = "A meaningful note needs at least 5 characters."; else if (e.notes.trim().length > 250) errors.notes = "Keep notes below 250 characters."; return errors; };
  const saveExpense = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!cycle) return;
    const errors = validate(expense);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Please complete all required fields before adding the expense.");
      return;
    }

    let savedId = expense.id;
    try {
      if (expense.id) {
        // Update in PostgreSQL Database
        await expenseService.update(expense.id, {
          name: expense.name,
          date: expense.date,
          amount: Number(expense.amount),
          category: expense.category,
          paymentMethod: expense.payment,
          notes: expense.notes,
          salaryCycleId: cycle.id,
        });
        toast.success("Expense updated in Database! ðŸ’¾");
      } else {
        // Create in PostgreSQL Database
        const res = await expenseService.create({
          name: expense.name,
          date: expense.date,
          amount: Number(expense.amount),
          category: expense.category,
          paymentMethod: expense.payment,
          notes: expense.notes,
          salaryCycleId: cycle.id,
        });
        savedId = res.id;
        toast.success("Expense saved to PostgreSQL Database! ðŸ’¾");
      }
    } catch (apiErr: any) {
      console.warn("Backend API not reachable, saved locally:", apiErr);
      toast.success(expense.id ? "Expense updated (local)" : "Expense added (local)");
    }

    const next = {
      ...expense,
      id: savedId || expense.id || crypto.randomUUID(),
      amount: Number(expense.amount),
      valid: true,
    };
    updateCycle({
      ...cycle,
      expenses: expense.id
        ? cycle.expenses.map((e) => (e.id === expense.id ? next : e))
        : [next, ...cycle.expenses],
    });

    if (sheetsConfig.autoSync && sheetsConfig.webhookUrl) {
      syncSingleExpenseToGoogleSheets(
        sheetsConfig.webhookUrl,
        cycle.month,
        expense.id ? "update" : "add",
        next
      ).then((ok) => {
        if (ok) toast.success("Auto-synced with Google Sheets!");
      });
    }

    setExpenseOpen(false);
    setEditing(null);
    setExpense(emptyExpense());
    setFormErrors({});
  };

  const deleteExpense = async (id: string) => {
    if (!cycle || !window.confirm("Delete Expense?\n\nAre you sure you want to delete this expense?")) return;

    try {
      await expenseService.delete(id);
      toast.success("Expense deleted from Database! ðŸ—‘ï¸");
    } catch (apiErr) {
      console.warn("API delete:", apiErr);
      toast.success("Expense deleted");
    }

    const target = cycle.expenses.find((e) => e.id === id);
    updateCycle({ ...cycle, expenses: cycle.expenses.filter((e) => e.id !== id) });

    if (sheetsConfig.autoSync && sheetsConfig.webhookUrl && target) {
      syncSingleExpenseToGoogleSheets(sheetsConfig.webhookUrl, cycle.month, "delete", target).then((ok) => {
        if (ok) toast.success("Google Sheets updated!");
      });
    }
  };

  const saveSalary = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const salaryNum = Number(salary.salary),
      balanceNum = Number(salary.balance);
    if (
      !salary.month ||
      !salary.salaryDate ||
      salaryNum <= 0 ||
      balanceNum < 0 ||
      Number(salary.daily) <= 0 ||
      Number(salary.weekly) <= 0 ||
      Number(salary.monthly) <= 0
    ) {
      toast.error("Complete the salary cycle fields with valid amounts.");
      return;
    }

    let savedCycleId = salary.id;
    try {
      if (salary.id) {
        // Update in PostgreSQL Database
        await salaryCycleService.update(salary.id, {
          month: salary.month,
          salaryDate: salary.salaryDate,
          salaryAmount: salaryNum,
          existingBalance: balanceNum,
          dailyBudget: Number(salary.daily),
          weeklyBudget: Number(salary.weekly),
          monthlyBudget: Number(salary.monthly),
          notes: salary.notes,
          isCurrentCycle: true,
        });
        toast.success(`${monthLabel(salary.month)} cycle updated in Database! ðŸ’¾`);
      } else {
        // Create in PostgreSQL Database
        const res = await salaryCycleService.create({
          month: salary.month,
          salaryDate: salary.salaryDate,
          salaryAmount: salaryNum,
          existingBalance: balanceNum,
          dailyBudget: Number(salary.daily),
          weeklyBudget: Number(salary.weekly),
          monthlyBudget: Number(salary.monthly),
          notes: salary.notes,
          isCurrentCycle: true,
        });
        savedCycleId = res.id;
        toast.success(`${monthLabel(salary.month)} cycle saved to PostgreSQL Database! ðŸ’¾`);
      }
    } catch (apiErr) {
      console.warn("Salary API save error:", apiErr);
      toast.success(
        salary.id
          ? `${monthLabel(salary.month)} cycle updated`
          : `${monthLabel(salary.month)} cycle created`
      );
    }

    const id = savedCycleId || salary.id || crypto.randomUUID();
    const next: Cycle = {
      id,
      month: salary.month,
      salaryDate: salary.salaryDate,
      salary: salaryNum,
      balance: balanceNum,
      notes: salary.notes,
      budgets: {
        daily: Number(salary.daily),
        weekly: Number(salary.weekly),
        monthly: Number(salary.monthly),
      },
      expenses: salary.id && cycle ? cycle.expenses : [],
    };

    if (salary.id) {
      updateCycle(next);
    } else {
      setStore((s) => ({ ...s, cycles: [next, ...s.cycles], activeId: id }));
    }
    setSalaryOpen(false);
    setView("dashboard");
  };

  const openNewSalary = () => {
    const previous = cycle && stats ? stats.remaining : 0;
    setSalary({
      id: "",
      month: new Date().toISOString().slice(0, 7),
      salaryDate: isoToday(),
      salary: "",
      balance: previous ? String(previous) : "",
      notes: "",
      daily: cycle ? String(cycle.budgets.daily) : "500",
      weekly: cycle ? String(cycle.budgets.weekly) : "3500",
      monthly: cycle ? String(cycle.budgets.monthly) : "15000",
    });
    setSalaryOpen(true);
  };

  const openEditSalary = () => {
    if (!cycle) return;
    setSalary({
      id: cycle.id,
      month: cycle.month,
      salaryDate: cycle.salaryDate,
      salary: String(cycle.salary),
      balance: String(cycle.balance),
      notes: cycle.notes,
      daily: String(cycle.budgets.daily),
      weekly: String(cycle.budgets.weekly),
      monthly: String(cycle.budgets.monthly),
    });
    setSalaryOpen(true);
  };

  const deleteSalary = async () => {
    if (
      !cycle ||
      !window.confirm(
        "Delete Salary Cycle?\n\nAre you sure you want to delete this salary cycle? All expenses within this cycle will be lost."
      )
    )
      return;

    try {
      await salaryCycleService.delete(cycle.id);
      toast.success("Salary cycle deleted from Database! ðŸ—‘ï¸");
    } catch (apiErr) {
      console.warn("API salary delete:", apiErr);
      toast.success("Salary cycle deleted");
    }

    setStore((s) => {
      const remaining = s.cycles.filter((c) => c.id !== cycle.id);
      return { ...s, cycles: remaining, activeId: remaining[0]?.id || null };
    });
  };
  const input = (label: string, key: keyof Expense, type = "text") => <label className="field"><span>{label}<b>*</b></span><input ref={el => { if (formErrors[key] && !firstInvalid.current) firstInvalid.current = el; }} type={type} value={expense[key] as string | number} onChange={e => setExpense({ ...expense, [key]: type === "number" ? e.target.value : e.target.value })} className={formErrors[key] ? "invalid" : ""} />{formErrors[key] && <small>{formErrors[key]}</small>}</label>;

  return (
    <div
      className={`app-shell ${isLight ? "theme-light" : ""}`}
      style={{
        backgroundImage: isLight
          ? `linear-gradient(rgba(248, 245, 239, 0.94), rgba(243, 238, 230, 0.96)), url(${hogbgImg})`
          : `linear-gradient(rgba(15, 9, 5, 0.5), rgba(15, 9, 5, 0.6)), url(${hogbgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh"
      }}
    >
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu">
          <X size={20} />
        </button>

        <div className="brand">
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <img
              src={cleanHatImg}
              alt="Sorting Hat"
              style={{
                position: "absolute",
                top: "-64px",
                left: "-24px",
                width: "110px",
                height: "110px",
                objectFit: "contain",
                filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.5))",
                zIndex: 10,
                transform: "rotate(-12deg)",
                pointerEvents: "none"
              }}
            />
            <img
              src={kayalLogo}
              alt="Kayal Logo"
              style={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
                borderRadius: "10px",
                filter: "drop-shadow(0 4px 12px rgba(198, 116, 68, 0.4))"
              }}
            />
          </div>
          <div>
            <strong>{brand.name}</strong>
            <span style={{ color: "#dfc7b5" }}>{brand.suffix}</span>
          </div>
        </div>

        <div className="rail-label" style={{ color: isLight ? "#7a5c48" : "#a88c78", margin: "10px 0 6px" }}>Workspace</div>

        <button
          className={view === "dashboard" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("dashboard"); setMobileNav(false); }}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </button>

        <button
          className={view === "expenses" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("expenses"); setMobileNav(false); }}
        >
          <Receipt size={18} />
          <span>Expenses</span>
        </button>

        <button
          className={view === "analytics" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("analytics"); setMobileNav(false); }}
        >
          <BarChart3 size={18} />
          <span>Analytics</span>
        </button>

        <button
          className={view === "budgets" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("budgets"); setMobileNav(false); }}
        >
          <Target size={18} />
          <span>Budgets</span>
        </button>

        <button
          className={view === "history" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("history"); setMobileNav(false); }}
        >
          <CalendarDays size={18} />
          <span>Monthly history</span>
        </button>

        <button
          className={view === "users" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("users"); setMobileNav(false); }}
        >
          <Users size={18} />
          <span>User Profiles</span>
        </button>

        <button
          className={view === "sheets" ? "nav-item active" : "nav-item"}
          onClick={() => { setView("sheets"); setMobileNav(false); }}
        >
          <FileSpreadsheet size={18} />
          <span>Google Sheets</span>
        </button>

        <div className="sidebar-foot" style={{ marginTop: "auto", borderTop: isLight ? "1px solid rgba(184, 106, 60, 0.15)" : "1px solid rgba(223, 210, 195, 0.12)", paddingTop: "16px" }}>
          <div className="rail-label" style={{ color: isLight ? "#7a5c48" : "#a88c78" }}>Appearance</div>
          <div
            className="theme-sidebar-item"
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: "10px",
              background: isLight ? "rgba(184, 106, 60, 0.08)" : "rgba(0, 0, 0, 0.25)",
              border: isLight ? "1px solid rgba(184, 106, 60, 0.25)" : "1px solid rgba(198, 116, 68, 0.3)",
              cursor: "pointer",
              marginBottom: "12px",
              color: isLight ? "#2d1810" : "#d6beae",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.25s ease"
            }}
            title={isLight ? "Switch to Dark Mode (Original)" : "Switch to Light Mode (High visibility)"}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              {isLight ? <Sun size={15} style={{ color: "#d97706" }} /> : <Moon size={15} style={{ color: "#7dd3fc" }} />}
              <span>{isLight ? "Light Mode" : "Dark Mode"}</span>
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 7px",
                borderRadius: "10px",
                background: isLight ? "#b86a3c" : "rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontWeight: 800
              }}
            >
              {isLight ? "Light" : "Dark"}
            </span>
          </div>

          <div className="rail-label" style={{ color: isLight ? "#7a5c48" : "#a88c78" }}>Preferences</div>
          <div className="threshold" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(198, 116, 68, 0.3)", color: "#d6beae" }}>
            <Settings2 size={16} />
            <span>Low balance alert</span>
            <input
              type="number"
              min="1"
              max="90"
              value={store.lowBalanceThreshold}
              onChange={e => setStore({ ...store, lowBalanceThreshold: Number(e.target.value) })}
              style={{ color: "#fff" }}
            />
            <em>%</em>
          </div>

          <button
            className="nav-item"
            onClick={() => { setProfileModalOpen(true); setMobileNav(false); }}
            style={{
              color: "#d6beae",
              marginTop: "10px",
              border: "1px solid rgba(223, 210, 195, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "10px",
              width: "100%"
            }}
          >
            <User size={16} /> My Profile
          </button>

          <p style={{ color: "#a88c78", marginTop: "10px" }}>Private by design. Your records stay in this browser.</p>

          {onLogout && (
            <button
              className="nav-item"
              onClick={onLogout}
              style={{
                color: "#e59b6e",
                marginTop: "10px",
                border: "1px solid rgba(198, 116, 68, 0.3)",
                background: "rgba(198, 116, 68, 0.12)",
                borderRadius: "10px",
                width: "100%"
              }}
            >
              <LogOut size={16} /> Log out
            </button>
          )}
        </div>
      </aside>

      {mobileNav && <div className="sidebar-backdrop" onClick={() => setMobileNav(false)} />}

      <main className="main">
        <header className="topbar anim-fade-up">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <div className="topbar-branding">
            <img
              src={cleanLetterImg}
              alt="Hogwarts Letter"
              className="topbar-letter-img"
              style={{
                width: "76px",
                height: "76px",
                objectFit: "contain",
                filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.5))"
              }}
            />
            <div>
              <p className="eyebrow" style={{ color: isLight ? "#7a5c48" : "#8d7b6e" }}>
                {view === "dashboard" ? "Cycle pulse & quick summary"
                  : view === "expenses" ? "Manage & filter recorded expenses"
                  : view === "analytics" ? "Category mix & payment breakdowns"
                  : view === "budgets" ? "Daily, weekly & monthly allowances"
                  : view === "history" ? "Past salary months & archives"
                  : view === "users" ? "Manage user accounts & credentials"
                  : "Cloud spreadsheet integration"}
              </p>
              <h1 className="topbar-title" style={{ color: isLight ? "#1f1610" : "white", fontSize: "1.85rem", marginTop: "2px" }}>
                {view === "dashboard" ? "Overview & Workspace"
                  : view === "expenses" ? "Expense Ledger"
                  : view === "analytics" ? "Spending Analytics"
                  : view === "budgets" ? "Budget Controls"
                  : view === "history" ? "Monthly History"
                  : view === "users" ? "User Profiles & Accounts"
                  : "Google Sheets Sync"}
              </h1>
            </div>
          </div>

          <div className="top-actions">
            {/* Theme Toggle Pill (Dark / Light) */}
            <div
              className={`theme-toggle-pill ${isLight ? "light" : "dark"}`}
              onClick={toggleTheme}
              role="button"
              tabIndex={0}
              title={isLight ? "Switch to Dark Mode (Original theme)" : "Switch to Light Mode (High visibility)"}
              aria-label="Toggle Light and Dark Mode"
            >
              <div className={`theme-pill-option ${!isLight ? "active" : ""}`}>
                <Moon size={13} />
                <span>Dark</span>
              </div>
              <div className={`theme-pill-option ${isLight ? "active" : ""}`}>
                <Sun size={13} />
                <span>Light</span>
              </div>
            </div>
            {cycle && (
              <span className="cycle-chip">
                <span className="dot" /> {monthLabel(cycle.month)}
              </span>
            )}
            {(sheetsConfig.docUrl || sheetsConfig.webhookUrl) && (
              <a
                href={sheetsConfig.docUrl || sheetsConfig.webhookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button secondary topbar-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "10px",
                  background: "rgba(184, 106, 60, 0.12)",
                  color: "#b86a3c",
                  border: "1px solid rgba(184, 106, 60, 0.3)",
                  textDecoration: "none"
                }}
              >
                <ExternalLink size={16} /> View Sheet
              </a>
            )}
            <button
              className="button secondary topbar-btn"
              onClick={() => setSheetsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#f5d0b5",
                border: "1px solid rgba(198, 116, 68, 0.35)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
              }}
            >
              <FileSpreadsheet size={16} /> Google Sheets
            </button>
            <button
              className="button primary topbar-btn"
              onClick={openNewSalary}
              style={{ borderRadius: "10px" }}
            >
              <Plus size={16} /> New salary month
            </button>
          </div>
        </header>

        {view === "users" ? (
          <UserManagement />
        ) : view === "history" ? (
          <History
            cycles={store.cycles}
            activeId={store.activeId}
            onOpen={c => {
              setStore({ ...store, activeId: c.id });
              setSelectedHistory(c);
              setView("dashboard");
            }}
            onCreate={openNewSalary}
            hatImg={cleanHatImg}
            isLight={isLight}
          />
        ) : !cycle ? (
          <EmptyState onCreate={openNewSalary} hatImg={cleanHatImg} />
        ) : view === "expenses" ? (
          <ExpensesView
            cycle={cycle}
            expenses={cycle.expenses}
            filtered={filtered}
            filters={filters}
            onSetFilters={setFilters}
            onOpenAddExpense={() => {
              setExpense(emptyExpense());
              setEditing(null);
              setExpenseOpen(true);
            }}
            onEditExpense={e => {
              setExpense(e);
              setEditing(e);
              setExpenseOpen(true);
            }}
            onDeleteExpense={deleteExpense}
            onDownloadCsv={() => downloadCsv(cycle)}
            onPrintPdf={() => printPdf(cycle)}
            onOpenSheetsModal={() => setSheetsModalOpen(true)}
            isLight={isLight}
            money={money}
            dayLabel={dayLabel}
            monthLabel={monthLabel}
            getCategoryIcon={getCategoryIcon}
            getPaymentIcon={getPaymentIcon}
            CATEGORIES={CATEGORIES}
            PAYMENTS={PAYMENTS}
          />
        ) : view === "analytics" ? (
          <AnalyticsView
            cycle={cycle}
            stats={stats!}
            isLight={isLight}
            money={money}
            monthLabel={monthLabel}
            getCategoryIcon={getCategoryIcon}
            getPaymentIcon={getPaymentIcon}
            onNavigateToExpenses={() => setView("expenses")}
          />
        ) : view === "budgets" ? (
          <BudgetsView
            cycle={cycle}
            stats={stats!}
            isLight={isLight}
            money={money}
            dayLabel={dayLabel}
            monthLabel={monthLabel}
            cycleDays={cycleDays}
            onOpenEditSalary={openEditSalary}
            onNavigateToExpenses={() => setView("expenses")}
          />
        ) : view === "sheets" ? (
          <GoogleSheetsView
            cycle={cycle}
            config={sheetsConfig}
            onUpdateConfig={setSheetsConfig}
            isLight={isLight}
            money={money}
            monthLabel={monthLabel}
          />
        ) : (
          <OverviewView
            cycle={cycle}
            stats={stats!}
            alertItems={alertItems}
            isLight={isLight}
            money={money}
            dayLabel={dayLabel}
            monthLabel={monthLabel}
            cycleDays={cycleDays}
            expectoPatronumImg={expectoPatronumImg}
            onOpenAddExpense={() => {
              setExpense(emptyExpense());
              setEditing(null);
              setExpenseOpen(true);
            }}
            onOpenEditSalary={openEditSalary}
            onDeleteSalary={deleteSalary}
            onOpenSheetsModal={() => setSheetsModalOpen(true)}
            onDownloadCsv={() => downloadCsv(cycle)}
            onPrintPdf={() => printPdf(cycle)}
            onNavigate={setView}
            getCategoryIcon={getCategoryIcon}
            getPaymentIcon={getPaymentIcon}
            StatCard={StatCard}
            BudgetCard={BudgetCard}
          />
        )}
      </main>

      {salaryOpen && (
        <Modal
          title={salary.id ? "Edit salary cycle" : "Create a salary cycle"}
          subtitle={salary.id ? "Update the details for this month." : "A new page for a new month. Previous pages remain untouched."}
          onClose={() => setSalaryOpen(false)}
          isLight={isLight}
        >
          <form className="modal-form" onSubmit={saveSalary}>
            <div className="form-grid">
              <label className="field">
                <span>Month<b>*</b></span>
                <input type="month" value={salary.month} onChange={e => setSalary({ ...salary, month: e.target.value })} />
              </label>
              <label className="field">
                <span>Salary date<b>*</b></span>
                <input type="date" value={salary.salaryDate} onChange={e => setSalary({ ...salary, salaryDate: e.target.value })} />
              </label>
              <label className="field">
                <span>Salary amount<b>*</b></span>
                <input type="number" min="1" value={salary.salary} onChange={e => setSalary({ ...salary, salary: e.target.value })} placeholder="25000" />
              </label>
              <label className="field">
                <span>Existing balance<b>*</b></span>
                <input type="number" min="0" value={salary.balance} onChange={e => setSalary({ ...salary, balance: e.target.value })} placeholder="8500" />
              </label>
            </div>
            {cycle && stats && (
              <button type="button" className="balance-suggestion" onClick={() => setSalary({ ...salary, balance: String(stats.remaining) })}>
                <Check size={15} /> Use previous remaining balance Â· {money(stats.remaining)}
              </button>
            )}
            <label className="field">
              <span>Notes</span>
              <textarea value={salary.notes} onChange={e => setSalary({ ...salary, notes: e.target.value })} placeholder="A short note about this month" />
            </label>
            <div className="available-preview">
              <span>Total available</span>
              <strong>{money(Number(salary.salary || 0) + Number(salary.balance || 0))}</strong>
            </div>
            <div className="budget-edit">
              <p className="eyebrow">Budget guardrails</p>
              <div className="form-grid three">
                <label className="field"><span>Daily</span><input type="number" min="1" value={salary.daily} onChange={e => setSalary({ ...salary, daily: e.target.value })} /></label>
                <label className="field"><span>Weekly</span><input type="number" min="1" value={salary.weekly} onChange={e => setSalary({ ...salary, weekly: e.target.value })} /></label>
                <label className="field"><span>Monthly</span><input type="number" min="1" value={salary.monthly} onChange={e => setSalary({ ...salary, monthly: e.target.value })} /></label>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="button ghost" onClick={() => setSalaryOpen(false)}>Cancel</button>
              <button className="button primary" type="submit">{salary.id ? "Update month" : "Create month"} <ChevronRight size={16} /></button>
            </div>
          </form>
        </Modal>
      )}

      {expenseOpen && (
        <Modal
          title={editing ? "Edit expense" : "Record an expense"}
          subtitle="Every field is required, including a meaningful note."
          onClose={() => { setExpenseOpen(false); setFormErrors({}); }}
          isLight={isLight}
        >
          <form className="modal-form" onSubmit={saveExpense}>
            <div className="form-grid">
              {input("Expense date", "date", "date")}
              {input("Expense name", "name")}
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Category<b>*</b></span>
                <select value={expense.category} onChange={e => setExpense({ ...expense, category: e.target.value })} className={formErrors.category ? "invalid" : ""}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(x => <option key={x}>{x}</option>)}
                </select>
                {formErrors.category && <small>{formErrors.category}</small>}
              </label>
              <label className="field">
                <span>Payment method<b>*</b></span>
                <select value={expense.payment} onChange={e => setExpense({ ...expense, payment: e.target.value })} className={formErrors.payment ? "invalid" : ""}>
                  <option value="">Select Payment Method</option>
                  {PAYMENTS.map(x => <option key={x}>{x}</option>)}
                </select>
                {formErrors.payment && <small>{formErrors.payment}</small>}
              </label>
            </div>
            <div className="form-grid">
              {input("Amount", "amount", "number")}
              <label className="field">
                <span>Notes<b>*</b></span>
                <textarea
                  value={expense.notes}
                  maxLength={250}
                  onChange={e => setExpense({ ...expense, notes: e.target.value })}
                  className={formErrors.notes ? "invalid" : ""}
                  placeholder="e.g. Lunch at office"
                />
                {formErrors.notes && <small>{formErrors.notes}</small>}
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button ghost" onClick={() => setExpenseOpen(false)}>Cancel</button>
              <button className="button primary" type="submit"><Check size={16} /> {editing ? "Update expense" : "Add expense"}</button>
            </div>
          </form>
        </Modal>
      )}

      {sheetsModalOpen && (
        <GoogleSheetsModal
          config={sheetsConfig}
          activeCycle={cycle}
          onClose={() => setSheetsModalOpen(false)}
          onConfigChange={setSheetsConfig}
        />
      )}

      {profileModalOpen && (
        <ProfileModal onClose={() => setProfileModalOpen(false)} />
      )}
    </div>
  );;
}
function StatCard({ icon, label, value, isLight }: { icon: React.ReactNode; label: string; value: string; isLight?: boolean }) {
  return (
    <div
      className="stat-card"
      style={isLight ? {
        background: "rgba(255, 255, 255, 0.95)",
        border: "1.5px solid rgba(220, 200, 185, 0.8)",
        boxShadow: "0 8px 25px rgba(80, 50, 30, 0.06)",
        color: "#1f1610"
      } : undefined}
    >
      <span className="stat-icon" style={{ background: "linear-gradient(135deg, #b86a3c, #8c4c28)", color: "#fff", boxShadow: "0 4px 14px rgba(184, 106, 60, 0.4)" }}>
        {icon}
      </span>
      <div>
        <small style={{ color: isLight ? "#7a5c48" : "#d6beae" }}>{label}</small>
        <strong style={{ fontSize: "1.25rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{value}</strong>
      </div>
    </div>
  );
}

function BudgetCard({ label, value, budget, tone, isLight }: { label: string; value: number; budget: number; tone: string; isLight?: boolean }) {
  const percent = Math.min(100, budget ? value / budget * 100 : 0);
  return (
    <div
      className="budget-card"
      style={{
        background: isLight
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(252, 247, 242, 0.98))"
          : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "16px",
        border: isLight ? "1.5px solid rgba(215, 195, 180, 0.8)" : "1px solid rgba(198, 116, 68, 0.35)",
        boxShadow: isLight
          ? "0 10px 30px rgba(80, 50, 30, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
          : "0 14px 35px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        padding: "20px"
      }}
    >
      <div>
        <p className="eyebrow" style={{ color: isLight ? "#8c5230" : "#e59b6e" }}>{label}</p>
        <strong style={{ fontSize: "1.35rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{money(value)}</strong>
        <span style={{ color: isLight ? "#6e5445" : "#dfc7b5" }}>of {money(budget)}</span>
      </div>
      <div className={`budget-ring ${tone}`} style={{ "--pct": `${percent}%` } as React.CSSProperties}>
        <b style={{ color: isLight ? "#1f1610" : "#ffffff" }}>
          {Math.round(percent)}<small style={{ color: isLight ? "#7a5c48" : "#dfc7b5" }}>%</small>
        </b>
      </div>
      <div className="budget-bar" style={{ height: "6px", borderRadius: "10px", marginTop: "12px", background: isLight ? "#ebe0d5" : "rgba(255, 255, 255, 0.12)" }}>
        <i className={tone} style={{ width: `${percent}%`, borderRadius: "10px" }} />
      </div>
    </div>
  );
}

function History({
  cycles,
  activeId,
  onOpen,
  onCreate,
  hatImg,
  isLight
}: {
  cycles: Cycle[];
  activeId: string | null;
  onOpen: (c: Cycle) => void;
  onCreate: () => void;
  hatImg?: string;
  isLight?: boolean;
}) {
  const [historySearch, setHistorySearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const totalCycles = cycles.length;
  const totalAvailableAll = useMemo(() => cycles.reduce((acc, c) => acc + totals(c).available, 0), [cycles]);
  const totalSpentAll = useMemo(() => cycles.reduce((acc, c) => acc + totals(c).total, 0), [cycles]);
  const totalRemainingAll = useMemo(() => cycles.reduce((acc, c) => acc + totals(c).remaining, 0), [cycles]);

  const years = useMemo(() => {
    const set = new Set<string>();
    cycles.forEach(c => {
      if (c.month) set.add(c.month.split("-")[0]);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [cycles]);

  const filteredCycles = useMemo(() => {
    return cycles.filter(c => {
      const label = monthLabel(c.month).toLowerCase();
      const notes = (c.notes || "").toLowerCase();
      const q = historySearch.toLowerCase().trim();
      const matchesSearch = !q || label.includes(q) || notes.includes(q) || c.month.includes(q);
      const matchesYear = selectedYear === "all" || c.month.startsWith(selectedYear);
      return matchesSearch && matchesYear;
    });
  }, [cycles, historySearch, selectedYear]);

  if (!cycles.length) {
    return <EmptyState onCreate={onCreate} hatImg={hatImg} />; 
  } 

  return (
    <section className="history-page anim-fade-up" style={{ width: "100%", maxWidth: "100%", margin: 0, paddingBottom: "40px" }}>
      {/* 1. Glass-Parchment Aligned Header Card */}
      <div
        className="history-header-card"
        style={{
          background: isLight
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 243, 235, 0.96))"
            : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "22px 28px",
          borderRadius: "18px",
          border: isLight ? "1.5px solid rgba(184, 106, 60, 0.3)" : "1px solid rgba(198, 116, 68, 0.35)",
          boxShadow: isLight ? "0 12px 35px rgba(80, 50, 30, 0.08)" : "0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
          width: "100%"
        }}
      >
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "6px", color: isLight ? "#8c5230" : "#e59b6e", margin: "0 0 4px" }}>
            <CalendarDays size={14} /> Preserved History Â· Archive Timeline
          </p>
          <h2 style={{ fontSize: "1.6rem", margin: "0 0 6px", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>
            Every Month, Kept Intact
          </h2>
          <p style={{ margin: 0, color: isLight ? "#6e5445" : "#dfc7b5", fontSize: "13px", lineHeight: 1.5 }}>
            Open an earlier salary cycle to review its entries and totals. Creating a new month never overwrites old records.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              background: isLight ? "rgba(184, 106, 60, 0.12)" : "rgba(184, 106, 60, 0.18)",
              color: isLight ? "#8c4c28" : "#f5d0b5",
              border: isLight ? "1px solid rgba(184, 106, 60, 0.3)" : "1px solid rgba(198, 116, 68, 0.4)",
              fontSize: "12px",
              fontWeight: 800
            }}
          >
            <Check size={14} /> {totalCycles} Saved Cycle{totalCycles === 1 ? "" : "s"}
          </span>
          <button
            className="button primary"
            onClick={onCreate}
            style={{
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
              color: "#ffffff",
              border: "none",
              boxShadow: "0 6px 18px rgba(184, 106, 60, 0.35)"
            }}
          >
            <Plus size={16} /> New salary month
          </button>
        </div>
      </div>

      {/* 2. Top Summary Aggregate Stats Row */}
      <div
        className="history-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
          width: "100%"
        }}
      >
        <div style={{ background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "16px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", boxShadow: isLight ? "0 8px 25px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0,0,0,0.45)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(184, 106, 60, 0.3)" }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <small style={{ color: isLight ? "#7a5c48" : "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, display: "block" }}>Total Cycles</small>
            <strong style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{totalCycles} Month{totalCycles === 1 ? "" : "s"}</strong>
          </div>
        </div>

        <div style={{ background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "16px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", boxShadow: isLight ? "0 8px 25px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0,0,0,0.45)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #0284c7, #0369a1)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)" }}>
            <CircleDollarSign size={20} />
          </div>
          <div>
            <small style={{ color: isLight ? "#7a5c48" : "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, display: "block" }}>Total Available</small>
            <strong style={{ fontSize: "1.45rem", color: isLight ? "#1f1610" : "#ffffff", fontWeight: 800 }}>{money(totalAvailableAll)}</strong>
          </div>
        </div>

        <div style={{ background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "16px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", boxShadow: isLight ? "0 8px 25px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0,0,0,0.45)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(184, 106, 60, 0.3)" }}>
            <ArrowDownRight size={20} />
          </div>
          <div>
            <small style={{ color: isLight ? "#7a5c48" : "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, display: "block" }}>Total Spent</small>
            <strong style={{ fontSize: "1.45rem", color: isLight ? "#b86a3c" : "#e59b6e", fontWeight: 800 }}>{money(totalSpentAll)}</strong>
          </div>
        </div>

        <div style={{ background: isLight ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: isLight ? "1.5px solid rgba(220, 200, 185, 0.8)" : "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "16px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", boxShadow: isLight ? "0 8px 25px rgba(80, 50, 30, 0.06)" : "0 14px 35px rgba(0,0,0,0.45)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #2e7d32, #1b5e20)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)" }}>
            <Wallet size={20} />
          </div>
          <div>
            <small style={{ color: isLight ? "#7a5c48" : "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, display: "block" }}>Total Remaining</small>
            <strong style={{ fontSize: "1.45rem", color: isLight ? "#15803d" : "#86efac", fontWeight: 800 }}>{money(totalRemainingAll)}</strong>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)", borderRadius: "10px", border: isLight ? "1.5px solid #dcc6b5" : "1px solid rgba(198, 116, 68, 0.35)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", minWidth: "260px" }}>
            <Search size={15} style={{ color: isLight ? "#8c5230" : "#dfc7b5" }} />
            <input
              placeholder="Search months or notes..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", color: isLight ? "#1f1610" : "#ffffff", fontSize: "13px", width: "100%" }}
            />
            {historySearch && (
              <button onClick={() => setHistorySearch("")} style={{ border: "none", background: "transparent", padding: 0, color: isLight ? "#8c5230" : "#dfc7b5", cursor: "pointer" }}>
                <X size={14} />
              </button>
            )}
          </div>

          {years.length > 1 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{ borderRadius: "10px", padding: "8px 14px", background: isLight ? "#ffffff" : "rgba(26, 15, 10, 0.9)", border: isLight ? "1.5px solid #dcc6b5" : "1px solid rgba(198, 116, 68, 0.35)", color: isLight ? "#1f1610" : "#ffffff", fontSize: "13px", outline: "none", colorScheme: isLight ? "light" : "dark" }}
            >
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y} style={{ background: isLight ? "#ffffff" : "#1a0f0a", color: isLight ? "#1f1610" : "#fff" }}>{y}</option>)}
            </select>
          )}
        </div>

        <div style={{ color: isLight ? "#7a5c48" : "#dfc7b5", fontSize: "12px", fontWeight: 700, letterSpacing: ".04em" }}>
          Showing {filteredCycles.length} of {totalCycles} salary {totalCycles === 1 ? "cycle" : "cycles"}
        </div>
      </div>

      {/* 4. Column Header Bar (Desktop Alignment Guide) */}
      <div className="history-column-header" style={{ color: isLight ? "#7a5c48" : "#dfc7b5" }}>
        <div>Salary Cycle & Preserved Period</div>
        <div>Total Available</div>
        <div>Spent & Utilization</div>
        <div>Remaining Balance</div>
        <div style={{ textAlign: "right" }}>Action</div>
      </div>

      {/* 5. Aligned Cards List */}
      <div className="history-list">
        {filteredCycles.length ? (
          filteredCycles.map(c => {
            const t = totals(c);
            const spentPct = Math.round(t.available > 0 ? (t.total / t.available) * 100 : 0);
            const isActive = c.id === activeId;

            return (
              <div
                className={`history-card anim-fade-up ${isActive ? "current" : ""}`}
                key={c.id}
                onClick={() => onOpen(c)}
              >
                {/* Column 1: Cycle Name, Status Badge, Start Date */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                        background: isActive ? "linear-gradient(135deg, rgba(184, 106, 60, 0.25), rgba(140, 76, 40, 0.35))" : "rgba(255, 255, 255, 0.08)",
                        color: isActive ? "#f5d0b5" : "#dfc7b5",
                        border: isActive ? "1px solid rgba(198, 116, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)"
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isActive ? "#b86a3c" : "#a89080" }} />
                      {isActive ? "Active Cycle" : "Preserved Archive"}
                    </span>
                    {c.notes && (
                      <span style={{ fontSize: "11px", color: "#dfc7b5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>
                        Â· {c.notes}
                      </span>
                    )}
                  </div>
                  <strong style={{ fontSize: "1.35rem", color: "#ffffff", fontWeight: 800, margin: "2px 0 0", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                    {monthLabel(c.month)}
                  </strong>
                  <small style={{ color: "#dfc7b5", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CalendarDays size={12} style={{ color: "#e59b6e" }} /> {dayLabel(c.salaryDate)} start Â· {c.expenses.length} {c.expenses.length === 1 ? "expense" : "expenses"}
                  </small>
                </div>

                {/* Column 2: Available */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <small style={{ color: "#d6beae", fontSize: "10px", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800 }}>Available</small>
                  <strong style={{ color: "#ffffff", fontSize: "1.3rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{money(t.available)}</strong>
                  <span style={{ color: "#dfc7b5", fontSize: "11px" }}>Salary: {money(c.salary)}</span>
                </div>

                {/* Column 3: Spent */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <small style={{ color: "#d6beae", fontSize: "10px", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800 }}>Spent</small>
                  <strong style={{ color: "#e59b6e", fontSize: "1.3rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{money(t.total)}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <div style={{ flex: 1, height: "6px", background: "rgba(255, 255, 255, 0.12)", borderRadius: "10px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, spentPct)}%`,
                          height: "100%",
                          background: spentPct > 100 ? "linear-gradient(90deg, #dc2626, #ef4444)" : "linear-gradient(90deg, #b86a3c, #8c4c28)",
                          borderRadius: "10px"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: spentPct > 100 ? "#f87171" : "#e59b6e", minWidth: "28px" }}>
                      {spentPct}%
                    </span>
                  </div>
                </div>

                {/* Column 4: Remaining */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <small style={{ color: "#d6beae", fontSize: "10px", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800 }}>Remaining</small>
                  <strong style={{ color: t.remaining < 0 ? "#f87171" : "#86efac", fontSize: "1.3rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                    {money(t.remaining)}
                  </strong>
                  <span style={{ color: t.remaining < 0 ? "#dc2626" : "#2e7d32", fontSize: "11px", fontWeight: 700 }}>
                    {t.remaining < 0 ? "Deficit" : "Safe balance"}
                  </span>
                </div>

                {/* Column 5: Action */}
                <div className="history-action-col" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      background: isActive ? "linear-gradient(135deg, #b86a3c, #8c4c28)" : "rgba(184, 106, 60, 0.12)",
                      color: isActive ? "#ffffff" : "#b86a3c",
                      border: isActive ? "none" : "1px solid rgba(184, 106, 60, 0.3)",
                      fontSize: "12px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      boxShadow: isActive ? "0 4px 14px rgba(184, 106, 60, 0.35)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Open <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ background: "rgba(253, 250, 246, 0.85)", borderRadius: "16px", padding: "36px", textAlign: "center", border: "1px solid rgba(220, 206, 190, 0.8)", width: "100%" }}>
            <ClipboardList size={32} style={{ color: "#b86a3c", margin: "0 auto 10px" }} />
            <strong style={{ display: "block", color: "#2b1a12", fontSize: "16px" }}>No matching salary cycles</strong>
            <p style={{ color: "#8d7b6e", fontSize: "13px", margin: "6px 0 16px" }}>No saved months matched your search "{historySearch}".</p>
            <button className="button secondary" onClick={() => { setHistorySearch(""); setSelectedYear("all"); }}>
              Reset filter
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
function EmptyState({ onCreate, hatImg }: { onCreate: () => void; hatImg?: string }) {
  const cleanPlatform = useTransparentImage(platformImg);
  const cleanOwl = useTransparentImage(owlImg);
  const cleanHarry = useTransparentImage(harryImg);

  return (
    <section className="empty-state anim-fade-up" style={{ width: "100%", maxWidth: "100%", minHeight: "calc(100vh - 130px)", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, padding: "0 0 20px" }}>
      {/* Executive Hero Banner Card - Full Width Glass Parchment */}
      <div
        className="blank-page empty-hero-card"
        style={{
          width: "100%",
          maxWidth: "100%",
          flex: 1,
          background: "rgba(15, 9, 5, 0.48)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "28px",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Ambient radial glow background */}
        <div style={{ position: "absolute", right: "-5%", top: "-20%", width: "650px", height: "650px", background: "radial-gradient(circle, rgba(198, 116, 68, 0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Left Column Text Content */}
        <div style={{ zIndex: 2, textAlign: "left", width: "100%" }}>
          <div className="blank-page-head" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              {hatImg && <img src={hatImg} alt="Sorting Hat" style={{ position: "absolute", top: "-54px", left: "-18px", width: "96px", height: "96px", objectFit: "contain", filter: "drop-shadow(0 5px 14px rgba(0,0,0,0.5))", zIndex: 10, transform: "rotate(-12deg)", pointerEvents: "none" }} />}
              <img src={kayalLogo} alt="Kayal Logo" style={{ width: "48px", height: "48px", objectFit: "contain", borderRadius: "12px", filter: "drop-shadow(0 4px 15px rgba(198, 116, 68, 0.4))" }} />
            </div>
            <span className="eyebrow" style={{ color: "#e59b6e", textTransform: "uppercase", letterSpacing: ".14em", fontSize: "11px", fontWeight: 800, margin: 0 }}>YOUR PRIVATE LEDGER</span>
          </div>

          <h2 className="empty-hero-title" style={{ color: "#ffffff", fontWeight: 800, margin: "0 0 14px", lineHeight: 1.18, letterSpacing: "-.02em" }}>
            Start with the month<br />you are in.
          </h2>

          <p style={{ color: "#dfc7b5", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: "540px", margin: "0 0 32px" }}>
            Create a salary cycle to set your available balance, guardrails, and executive financial page.<br />No transactions are generated automatically.
          </p>

          <button
            className="button primary"
            onClick={onCreate}
            style={{
              borderRadius: "14px",
              padding: "16px 36px",
              fontSize: "15px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #b86a3c 0%, #8c4c28 100%)",
              boxShadow: "0 10px 28px rgba(184, 106, 60, 0.4)",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Plus size={18} /> Create salary month
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px", color: "#d6beae", fontSize: "12px", fontWeight: 500 }}>
            <Lock size={13} style={{ color: "#e59b6e" }} /> Only you can see your data. It stays in this browser.
          </div>
        </div>

        {/* Right Column Clubbed Harry Potter Graphics */}
        <div className="empty-graphic-container">
          {/* Circular backdrop halo */}
          <div className="empty-halo" />
          {/* Sparkles */}
          <span style={{ position: "absolute", left: "20px", top: "25px", color: "#e59b6e", fontSize: "22px", zIndex: 6, opacity: 0.9 }}>âœ¦</span>
          <span style={{ position: "absolute", right: "30px", top: "15px", color: "#e59b6e", fontSize: "16px", zIndex: 6, opacity: 0.9 }}>âœ¦</span>
          <span style={{ position: "absolute", left: "10px", bottom: "40px", color: "#e59b6e", fontSize: "18px", zIndex: 6, opacity: 0.9 }}>âœ¦</span>

          {/* Platform 9 3/4 + Flying Harry Showcase */}
          <div className="empty-scene-wrap">
            {/* Platform 9 3/4 Sign (Centerpiece Landmark) */}
            <img
              src={cleanPlatform}
              alt="Platform 9 3/4"
              className="empty-platform-img"
            />

            {/* Harry Flying on Broomstick (Action Hero) */}
            <div className="empty-harry-wrap">
              <img
                src={cleanHarry}
                alt="Harry Potter"
                className="empty-harry-img"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feature Cards Row: Hedwig Owl & Expecto Patronum */}
      <div className="empty-features-grid">
        {/* 1. Hedwig Owl Card (Bottom Left) */}
        <div className="empty-feature-card hedwig-card">
          {/* Hedwig Portrait Frame */}
          <div className="empty-feature-portrait hedwig-portrait">
            <img src={owlImg} alt="Hedwig Owl" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(15, 9, 5, 0.75) 0%, transparent 45%)",
                pointerEvents: "none"
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "6px",
                left: "6px",
                right: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#f5eee6",
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "uppercase"
              }}
            >
              <span>Hedwig</span>
              <span style={{ color: "#e59b6e" }}>âœ¦</span>
            </div>
          </div>

          <div>
            <span
              className="eyebrow"
              style={{
                color: "#e59b6e",
                textTransform: "uppercase",
                letterSpacing: ".12em",
                fontSize: "11px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                margin: "0 0 4px"
              }}
            >
              <span>âœ¦</span> WISDOM & ARCHIVE
            </span>
            <h4 style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 800, margin: "0 0 6px" }}>
              Every Record Preserved
            </h4>
            <p style={{ color: "#dfc7b5", fontSize: "0.88rem", lineHeight: 1.5, margin: 0 }}>
              Your past salary cycles and daily expenses stay intact and organized in your browser.
            </p>
          </div>
        </div>

        {/* 2. Expecto Patronum Card (Bottom Right) */}
        <div className="empty-feature-card patronus-card">
          {/* Patronus Portrait Frame */}
          <div className="empty-feature-portrait patronus-portrait">
            <img src={expectoPatronumImg} alt="Expecto Patronum Stag" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(10, 18, 30, 0.75) 0%, transparent 45%)",
                pointerEvents: "none"
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "6px",
                left: "6px",
                right: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#e0f2fe",
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "uppercase"
              }}
            >
              <span>Patronus</span>
              <span style={{ color: "#7dd3fc" }}>âœ¦</span>
            </div>
          </div>

          <div>
            <span
              className="eyebrow"
              style={{
                color: "#7dd3fc",
                textTransform: "uppercase",
                letterSpacing: ".12em",
                fontSize: "11px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                margin: "0 0 4px"
              }}
            >
              <span>âœ¦</span> PATRONUS GUARDRAILS
            </span>
            <h4 style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 800, margin: "0 0 6px" }}>
              Financial Protection
            </h4>
            <p style={{ color: "#bae6fd", fontSize: "0.88rem", lineHeight: 1.5, margin: 0 }}>
              Daily, weekly, and monthly budget limits shield your available salary throughout the cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Quote Footer Strip */}
      <div className="empty-quote-strip">
        <div className="empty-quote-left">
          <span className="empty-quote-mark">â€œ</span>
          <span>A good plan today builds a stress-free tomorrow.</span>
        </div>
        <div className="empty-quote-right">
          <div className="empty-quote-divider" />
          <div className="empty-quote-tag">
            <TrendingUp size={16} style={{ color: "#e59b6e" }} />
            <span>Small steps. Big progress.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
function Modal({ title, subtitle, onClose, children, isLight }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; isLight?: boolean }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        style={isLight ? {
          background: "#ffffff",
          border: "1.5px solid #dfcfc2",
          boxShadow: "0 25px 70px rgba(80, 50, 30, 0.22)",
          color: "#1f1610"
        } : undefined}
      >
        <button
          className="modal-close"
          onClick={onClose}
          style={isLight ? { background: "#f7eee6", borderColor: "#dfcfc2", color: "#8c5230" } : undefined}
        >
          <X size={18} />
        </button>
        <p className="eyebrow" style={{ color: isLight ? "#b86a3c" : "#ff2a55", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", fontSize: "11px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>ðŸ©¸</span> Vampire Sanctum
        </p>
        <h2 style={{ color: isLight ? "#1f1610" : "#ffffff", fontSize: "1.8rem", fontWeight: 800, margin: "4px 0 8px", textShadow: isLight ? "none" : "0 0 16px rgba(225, 29, 72, 0.45)" }}>
          {title}
        </h2>
        <p className="modal-subtitle" style={{ color: isLight ? "#6e5445" : "#fda4af", fontSize: "13px", marginBottom: "20px" }}>
          {subtitle}
        </p>
        {children}
      </div>
    </div>
  );
}
