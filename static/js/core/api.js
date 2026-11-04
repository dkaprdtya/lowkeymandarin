// Lowkey Mandarin — API client
// Adds the CSRF header to state-changing calls and reports expired sessions.

function readCookie(name) {
  const prefix = `${name}=`;
  const parts = document.cookie ? document.cookie.split(";") : [];
  for (const part of parts) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return "";
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (method !== "GET" && method !== "HEAD") {
    const token = readCookie("hanzi_csrf");
    if (token) headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.error || detail;
    } catch (_e) { /* keep status text */ }
    const error = new Error(detail);
    error.status = res.status;
    if (res.status === 401 && !path.startsWith("/api/auth/")) {
      document.dispatchEvent(new CustomEvent("hanzi:authrequired"));
    }
    throw error;
  }
  return res.json();
}

export const get = (path) => request(path);
export const post = (path, data = {}) =>
  request(path, { method: "POST", body: JSON.stringify(data) });
