import apiClient from "./apiClient";

export interface ExpenseResponse {
  id: string;
  name: string;
  date: string;
  amount: number;
  category: string;
  paymentMethod: string;
  notes?: string;
  salaryCycleId?: string;
  isDelete: number; // 0 = active / not deleted, 1 = soft-deleted
  createdAt: string;
  updatedAt?: string;
}

export interface CreateExpenseDto {
  name: string;
  date: string;
  amount: number;
  category: string;
  paymentMethod: string;
  notes?: string;
  salaryCycleId?: string;
}

export interface UpdateExpenseDto {
  name: string;
  date: string;
  amount: number;
  category: string;
  paymentMethod: string;
  notes?: string;
  salaryCycleId?: string;
}

export interface ExpenseFilters {
  salaryCycleId?: string;
  category?: string;
  search?: string;
  includeDeleted?: boolean;
  isDelete?: number;
}

/**
 * Service for ExpensesController (/api/Expenses)
 */
export const expenseService = {
  /**
   * Gets all expenses with optional filtering.
   */
  async getAll(filters?: ExpenseFilters): Promise<ExpenseResponse[]> {
    const response = await apiClient.get<ExpenseResponse[]>("/Expenses", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Gets a single expense by Id.
   */
  async getById(id: string, includeDeleted = true): Promise<ExpenseResponse> {
    const response = await apiClient.get<ExpenseResponse>(`/Expenses/${id}`, {
      params: { includeDeleted },
    });
    return response.data;
  },

  /**
   * Creates a new expense entry.
   */
  async create(dto: CreateExpenseDto): Promise<ExpenseResponse> {
    const response = await apiClient.post<ExpenseResponse>("/Expenses", dto);
    return response.data;
  },

  /**
   * Updates an existing expense entry.
   */
  async update(id: string, dto: UpdateExpenseDto): Promise<ExpenseResponse> {
    const response = await apiClient.put<ExpenseResponse>(`/Expenses/${id}`, dto);
    return response.data;
  },

  /**
   * Deletes (soft deletes) an expense entry, setting isDelete = 1 in the database.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/Expenses/${id}`);
  },

  /**
   * Restores a previously soft-deleted expense, setting isDelete = 0.
   */
  async restore(id: string): Promise<ExpenseResponse> {
    const response = await apiClient.post<ExpenseResponse>(`/Expenses/${id}/restore`);
    return response.data;
  },
};

export default expenseService;
