export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ ok: false, error: "Missing password" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not set in environment variables.");
    return res.status(500).json({ ok: false, error: "Server misconfigured" });
  }

  if (password === adminPassword) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}