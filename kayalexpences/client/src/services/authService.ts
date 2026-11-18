import apiClient from "./apiClient";
import { UserProfile, RegisterUserDto, LoginDto, LoginResponse } from "./userService";

const AUTH_TOKEN_KEY = "kayal_auth_token";
const CURRENT_USER_KEY = "kayal_current_user";

/**
 * Service for AuthController (/api/Auth)
 */
export const authService = {
  /**
   * Registers a new user account with /api/Auth/register
   */
  async register(dto: RegisterUserDto): Promise<UserProfile> {
    const response = await apiClient.post<UserProfile>("/Auth/register", dto);
    return response.data;
  },

  /**
   * Authenticates user with /api/Auth/login and stores JWT/auth token in localStorage
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/Auth/login", credentials);
    if (response.data?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.data.profile));
    }
    return response.data;
  },

  /**
   * Gets user profile with /api/Auth/user
   */
  async getUser(email?: string): Promise<UserProfile> {
    const params = email ? { email } : {};
    const response = await apiClient.get<UserProfile>("/Auth/user", { params });
    return response.data;
  },

  /**
   * Logs out user session with /api/Auth/logout and clears tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/Auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  /**
   * Returns current user profile from localStorage
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
   * Checks if user has a valid active token
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};

export default authService;
