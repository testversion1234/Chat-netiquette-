// ai_client_patch.js — Netiquette Coach client
// Minimal client to call the serverless function on Vercel.
// No layout changes. No secrets in client.

// Absolute URL so it also works from GitHub Pages:
const ASK_ENDPOINT = "https://chat-netiquette.vercel.app/api/ask";

// Small helper: fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Ask the Netiquette-Coach for a response.
 * @param {string} prompt - user message to analyze/respond to
 * @returns {Promise<string>} coach reply text
 */
async function askCoach(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("askCoach: prompt must be a non-empty string");
  }
  const res = await fetchWithTimeout(ASK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: String(prompt) })
  }, 15000);

  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch (_) {}
    throw new Error(`Coach HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const data = await res.json().catch(() => ({}));
  const text = (data && typeof data.text === "string") ? data.text : "";
  return text;
}

// Expose globally for existing UI code
window.askCoach = askCoach;
