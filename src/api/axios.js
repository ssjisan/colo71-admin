import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API,
  withCredentials: true,
});

// ==================================================
// Response Interceptor
// ==================================================

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    const isLoginRequest = requestUrl.includes("/login");
    const isRefreshRequest = requestUrl.includes("/refresh");
    const isMeRequest = requestUrl.includes("/me");
    const isPasswordChangeRequest = requestUrl.includes("/change-password");

    // ------------------------------------------------
    // Login errors
    // LoginForm handles these
    // ------------------------------------------------

    if (isLoginRequest) {
      return Promise.reject(error);
    }

    // ------------------------------------------------
    // Password change errors
    // Password-change page handles these
    // ------------------------------------------------

    if (isPasswordChangeRequest) {
      return Promise.reject(error);
    }

    // ------------------------------------------------
    // /refresh itself should never trigger another
    // refresh request
    // ------------------------------------------------

    if (isRefreshRequest) {
      return Promise.reject(error);
    }

    // ------------------------------------------------
    // /me is used by AuthProvider to determine whether
    // a session exists.
    //
    // If /me fails, let AuthProvider handle it.
    // DO NOT redirect or reload the browser here.
    // ------------------------------------------------

    if (isMeRequest) {
      return Promise.reject(error);
    }

    // ------------------------------------------------
    // Access token expired
    // ------------------------------------------------

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Browser automatically sends refreshToken
        // because withCredentials = true.

        await API.post("/refresh");

        // Backend has now created a new accessToken
        // cookie.

        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed.
        //
        // IMPORTANT:
        // Do NOT redirect here.
        // React/AuthProvider will decide what to do.

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default API;
