import apiClient from "./apiClient";

export interface SalaryCycleResponse {
  id: string;
  month: string;
  salaryDate: string;
  salaryAmount: number;
  existingBalance: number;
  totalAvailable: number;
  totalExpenses: number;
  remainingBalance: number;
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  notes?: string;
  isCurrentCycle: boolean;
  expensesCount: number;
  isDelete: number; // 0 = active, 1 = soft-deleted
  createdAt: string;
}

export interface CreateSalaryCycleDto {
  month: string;
  salaryDate: string;
  salaryAmount: number;
  existingBalance?: number;
  dailyBudget?: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  notes?: string;
  isCurrentCycle?: boolean;
}

export interface UpdateSalaryCycleDto {
  month: string;
  salaryDate: string;
  salaryAmount: number;
  existingBalance?: number;
  dailyBudget?: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  notes?: string;
  isCurrentCycle: boolean;
}

/**
 * Service for SalaryCyclesController (/api/SalaryCycles)
 */
export const salaryCycleService = {
  /**
   * Gets all salary cycles ordered by date.
   */
  async getAll(includeDeleted = false): Promise<SalaryCycleResponse[]> {
    const response = await apiClient.get<SalaryCycleResponse[]>("/SalaryCycles", {
      params: { includeDeleted },
    });
    return response.data;
  },

  /**
   * Gets the active current salary cycle.
   */
  async getActive(): Promise<SalaryCycleResponse | null> {
    try {
      const response = await apiClient.get<SalaryCycleResponse>("/SalaryCycles/active");
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Gets a single salary cycle by Id.
   */
  async getById(id: string, includeDeleted = true): Promise<SalaryCycleResponse> {
    const response = await apiClient.get<SalaryCycleResponse>(`/SalaryCycles/${id}`, {
      params: { includeDeleted },
    });
    return response.data;
  },

  /**
   * Creates a new salary cycle month.
   */
  async create(dto: CreateSalaryCycleDto): Promise<SalaryCycleResponse> {
    const response = await apiClient.post<SalaryCycleResponse>("/SalaryCycles", dto);
    return response.data;
  },

  /**
   * Updates an existing salary cycle.
   */
  async update(id: string, dto: UpdateSalaryCycleDto): Promise<SalaryCycleResponse> {
    const response = await apiClient.put<SalaryCycleResponse>(`/SalaryCycles/${id}`, dto);
    return response.data;
  },

  /**
   * Deletes (soft deletes) a salary cycle, setting isDelete = 1 in the database.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/SalaryCycles/${id}`);
  },

  /**
   * Restores a previously soft-deleted salary cycle, setting isDelete = 0.
   */
  async restore(id: string): Promise<SalaryCycleResponse> {
    const response = await apiClient.post<SalaryCycleResponse>(`/SalaryCycles/${id}/restore`);
    return response.data;
  },
};

export default salaryCycleService;
