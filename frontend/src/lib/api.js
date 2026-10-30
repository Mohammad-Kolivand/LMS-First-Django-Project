const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("learnova_access_token");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("learnova_refresh_token");
}

export function saveTokens({ access, refresh }) {
  if (typeof window === "undefined") return;

  if (access) {
    window.localStorage.setItem("learnova_access_token", access);
  }

  if (refresh) {
    window.localStorage.setItem("learnova_refresh_token", refresh);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("learnova_access_token");
  window.localStorage.removeItem("learnova_refresh_token");
}

export async function apiRequest(path, options = {}) {
  const {
    headers: customHeaders = {},
    body,
    auth = true,
    ...fetchOptions
  } = options;

  const headers = new Headers(customHeaders);
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`,
      {
        ...fetchOptions,
        headers,
        body,
        cache: "no-store",
      },
    );
  } catch {
    throw new ApiError(
      "ارتباط با سرور برقرار نشد. وضعیت اجرای بک‌اند و آدرس API را بررسی کنید.",
      0,
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? data.detail ||
          data.message ||
          Object.values(data).flat().find((value) => typeof value === "string")
        : null;

    throw new ApiError(
      message || `درخواست ناموفق بود (${response.status}).`,
      response.status,
      data,
    );
  }

  return data;
}

export const api = {
  get: (path, options = {}) =>
    apiRequest(path, { ...options, method: "GET" }),

  post: (path, body, options = {}) =>
    apiRequest(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (path, body, options = {}) =>
    apiRequest(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: (path, body, options = {}) =>
    apiRequest(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: (path, options = {}) =>
    apiRequest(path, { ...options, method: "DELETE" }),
};
