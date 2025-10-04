export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  const { text } = req.body || {};
  const sanitized = String(text || "").replace(/@\w+/g, "@user");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein freundlicher Netiquette-Coach für Schülerinnen und Schüler. Antworte kurz, einfach und auf Deutsch." },
        { role: "user", content: sanitized }
      ]
    })
  });

  const data = await response.json();
  res.status(200).json({ reply: data.choices?.[0]?.message?.content || "Ich antworte freundlich 🙂" });
}
