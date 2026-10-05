export const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const pretty = (data, status) => {
  if (data.error || data.detail) return data.error || data.detail;
  const parts = Object.entries(data).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`);
  return parts.length ? parts.join(" | ") : `Server error ${status}. Please try again.`;
};

export const call = async (path, opts = {}, token) => {
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers: { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  } catch {
    throw new Error("Can't reach the server. Please check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(pretty(data, res.status));
  return data;
};
