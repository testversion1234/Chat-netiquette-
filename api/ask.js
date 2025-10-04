// /api/ask.js — robust POST JSON parser + clear errors
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  // ---- parse JSON body robustly (works on Vercel uploads & Next.js) ----
  let body = {};
  try {
    if (typeof req.body === "string") {
      body = JSON.parse(req.body || "{}");
    } else if (req.body && typeof req.body === "object") {
      body = req.body;
    } else {
      // fallback: manually read stream
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    }
  } catch (e) {
    console.error("[ask] JSON parse error:", e);
  }

  const userText = String(body.text || "").slice(0, 800);
  if (!userText) return res.status(200).json({ reply: "Formuliere bitte eine Frage oder Nachricht 🙂" });

  const sanitized = userText.replace(/@\w+/g, "@user").replace(/\S+@\S+\.\S+/g, "user@example.com");

  try {
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 140,
        messages: [
          { role: "system", content: "Du bist ein freundlicher, knapper Netiquette-Coach für 5. Klassen. Antworte in einfachem Deutsch, maximal 2 Sätze. Ermutige höfliches, respektvolles Verhalten. Keine Personendaten verarbeiten." },
          { role: "user", content: sanitized }
        ]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("[ask] OpenAI error:", apiRes.status, errText);
      return res.status(502).json({ reply: "Ich konnte gerade keine Antwort erzeugen. Versuch es gleich nochmal 🙂" });
    }

    const data = await apiRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      console.warn("[ask] No choices in response:", JSON.stringify(data).slice(0,300));
      return res.status(200).json({ reply: "Danke für deine Nachricht. Bitte achte auf respektvolle Sprache 🙂" });
    }
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[ask] Proxy exception:", err);
    return res.status(500).json({ reply: "Kleines Netzwerkproblem – versuch es gleich nochmal 😉" });
  }
}
