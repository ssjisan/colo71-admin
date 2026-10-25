import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API,
  withCredentials: true,
});

let refreshPromise = null;

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    const isLoginRequest = requestUrl.includes("/login");
    const isRefreshRequest = requestUrl.includes("/refresh");
    const isPasswordChangeRequest = requestUrl.includes("/change-password");
    const isLogoutRequest = requestUrl.includes("/logout");

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isLoginRequest ||
      isRefreshRequest ||
      isPasswordChangeRequest ||
      isLogoutRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = API.post("/refresh").finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;

      // Retry the original request with the refreshed cookie.
      return API(originalRequest);
    } catch (refreshError) {
      const refreshStatus = refreshError.response?.status;

      // Only clear local auth state when the session is rejected.
      if (refreshStatus === 401 || refreshStatus === 403) {
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");

        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }

      // For network errors or server errors, don't force logout.
      return Promise.reject(refreshError);
    }
  },
);

export default API;
