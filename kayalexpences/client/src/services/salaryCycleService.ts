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
  async getAll(): Promise<SalaryCycleResponse[]> {
    const response = await apiClient.get<SalaryCycleResponse[]>("/SalaryCycles");
    return response.data;
  },

  /**
   * Gets the active current salary cycle.
   */
  async getActive(): Promise<SalaryCycleResponse | null> {
    try {
      const response = await apiClient.get<SalaryCycleResponse>("/SalaryCycles/active");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Gets a salary cycle by Id.
   */
  async getById(id: string): Promise<SalaryCycleResponse> {
    const response = await apiClient.get<SalaryCycleResponse>(`/SalaryCycles/${id}`);
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
   * Soft deletes a salary cycle.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/SalaryCycles/${id}`);
  },
};

export default salaryCycleService;
