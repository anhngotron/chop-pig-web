export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ ok: false, error: "Missing password" });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}