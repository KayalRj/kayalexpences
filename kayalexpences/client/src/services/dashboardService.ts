import apiClient from "./apiClient";
import { ExpenseResponse } from "./expenseService";

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface DashboardSummary {
  activeCycleId: string | null;
  activeCycleMonth: string | null;
  totalAvailable: number;
  totalSpent: number;
  remainingBalance: number;
  spentPercentage: number;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  categoryBreakdown: CategoryBreakdown[];
  recentExpenses: ExpenseResponse[];
}

/**
 * Service for DashboardController (/api/Dashboard)
 */
export const dashboardService = {
  /**
   * Gets aggregated metrics, remaining balance, and breakdown for active or selected cycle.
   */
  async getSummary(salaryCycleId?: string): Promise<DashboardSummary> {
    const params = salaryCycleId ? { salaryCycleId } : {};
    const response = await apiClient.get<DashboardSummary>("/Dashboard/summary", { params });
    return response.data;
  },
};

export default dashboardService;
