export class ApiError extends Error {
  constructor(message, status = 0, payload = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.code = payload.code;
  }
}

async function request(path, { method = "GET", body, signal, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("We could not reach Daymark. Check your connection and try again.", 0);
  }
  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const message = payload?.error || "Something went wrong. Please try again.";
    if (response.status === 401 && !path.startsWith("/api/auth/")) {
      window.dispatchEvent(new CustomEvent("daymark:unauthorized"));
    }
    throw new ApiError(message, response.status, payload || {});
  }
  return payload;
}

export const api = {
  get(path, options = {}) {
    return request(path, { ...options, method: "GET" });
  },
  post(path, body = {}, options = {}) {
    return request(path, { ...options, method: "POST", body });
  },
  patch(path, body = {}, options = {}) {
    return request(path, { ...options, method: "PATCH", body });
  },
  delete(path, options = {}) {
    return request(path, { ...options, method: "DELETE" });
  }
};

export function qs(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}
