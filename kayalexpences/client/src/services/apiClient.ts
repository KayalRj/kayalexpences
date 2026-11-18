import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

// Default to backend ASP.NET Core Web API port 5277
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5277/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Attach bearer token if user is logged in
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem("kayal_auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage issues in non-browser envs
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error messages cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    let errorMessage = "An unexpected error occurred with the server.";

    if (error.response?.data) {
      if (typeof error.response.data.message === "string") {
        errorMessage = error.response.data.message;
      } else if (error.response.data.errors) {
        // Validation errors dictionary
        const validationMessages = Object.values(error.response.data.errors).flat();
        if (validationMessages.length > 0) {
          errorMessage = validationMessages.join(", ");
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Attach human-readable message
    (error as any).userFriendlyMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
