import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const provided = req.headers["x-app-password"];

    if (!provided || provided !== adminPassword) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { timestamp, players } = req.body;

    if (!timestamp || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo  = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ error: "Missing GitHub environment variables" });
    }

    const octokit = new Octokit({ auth: token });

    // Build a filesystem-safe filename from the ISO timestamp
    // e.g. "2026-04-16T14-30-00" → "logs/2026-04-16_14-30-00.json"
    const safeName = timestamp.replace(/:/g, "-").replace("T", "_").slice(0, 19);
    const path = `logs/${safeName}.json`;

    const logEntry = {
      timestamp,
      players
    };

    const content = Buffer.from(JSON.stringify(logEntry, null, 2)).toString("base64");

    // This is always a new file — no sha needed
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `log: game ${safeName}`,
      content
      // no sha → always creates a new file
    });

    return res.status(200).json({ ok: true, path });
  } catch (err) {
    console.error("log-game error:", err);
    return res.status(500).json({ error: err.message });
  }
}
