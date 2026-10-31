import axios from "../../../api/axios";

export const resolveAssetUrl = (url) => {
  if (typeof url !== "string" || !url) return "";
  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  const baseURL = axios.defaults?.baseURL;
  if (!baseURL) return url;

  try {
    const apiBase = new URL(baseURL, window.location.origin);
    return new URL(url, apiBase.origin).toString();
  } catch {
    return url;
  }
};
