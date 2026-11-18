import apiClient from "./apiClient";

export interface UserProfile {
  id: string;
  fullName?: string;
  email: string;
  backupEmail?: string;
  mobileNumber?: string;
  place?: string;
  monthlySalary: number;
  role: string;
  createdAt: string;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  fullName?: string;
  backupEmail?: string;
  mobileNumber?: string;
  place?: string;
  monthlySalary?: number;
  role?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  role: string;
  token: string;
  profile: UserProfile;
}

export interface UpdateUserDto {
  fullName?: string;
  backupEmail?: string;
  mobileNumber?: string;
  place?: string;
  monthlySalary?: number;
  role?: string;
}

const AUTH_TOKEN_KEY = "kayal_auth_token";
const CURRENT_USER_KEY = "kayal_current_user";

/**
 * Service for UsersController (/api/Users)
 */
export const userService = {
  /**
   * Registers a new user account on the backend.
   */
  async register(dto: RegisterUserDto): Promise<UserProfile> {
    const response = await apiClient.post<UserProfile>("/Users/register", dto);
    return response.data;
  },

  /**
   * Logs in a user, stores the JWT token and profile in localStorage.
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/Users/login", credentials);
    if (response.data?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.data.profile));
    }
    return response.data;
  },

  /**
   * Gets all registered users (for user management / admin).
   */
  async getAll(): Promise<UserProfile[]> {
    const response = await apiClient.get<UserProfile[]>("/Users");
    return response.data;
  },

  /**
   * Gets user profile by Id.
   */
  async getById(id: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/Users/${id}`);
    return response.data;
  },

  /**
   * Updates user profile.
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>(`/Users/${id}`, dto);
    return response.data;
  },

  /**
   * Soft deletes a user account.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/Users/${id}`);
  },

  /**
   * Logs out the user by clearing localStorage tokens.
   */
  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  /**
   * Returns the currently stored user profile from localStorage.
   */
  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Checks if user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};

export default userService;
