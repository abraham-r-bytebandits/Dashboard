import axios, { type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from "axios";

// Define the type for the refresh token response
interface RefreshTokenResponse {
  accessToken: string;
}

// Define a custom config type with _retry property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create the axios instance with proper typing
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach access token automatically
api.interceptors.request.use((config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const accessToken: string | null =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Auto refresh token if access token expires
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken: string | null =
          localStorage.getItem("refreshToken") ||
          sessionStorage.getItem("refreshToken");

        if (!refreshToken) {
          localStorage.clear();
          sessionStorage.clear();
          return Promise.reject(error);
        }

        const res = await axios.post<RefreshTokenResponse>(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken: string = res.data.accessToken;

        if (localStorage.getItem("accessToken")) {
          localStorage.setItem("accessToken", newAccessToken);
        } else {
          sessionStorage.setItem("accessToken", newAccessToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;