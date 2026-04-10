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

    const { allTime, weekly, weeklyReset, weeklyHistory, version: incomingVersion } = req.body;

    if (
      !allTime ||
      !weekly ||
      !weeklyReset ||
      !weeklyHistory ||
      incomingVersion === undefined
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ error: "Missing GitHub environment variables" });
    }

    const octokit = new Octokit({ auth: token });
    const path = "chop_pig_state_latest.json";

    let sha = null;
    let currentVersion = 0;

    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      sha = data.sha;

      const decoded = Buffer.from(data.content, "base64").toString("utf8");
      const existing = JSON.parse(decoded);

      currentVersion = existing.version || 0;
    } catch (err) {
      sha = null;
      currentVersion = 0;
    }

    // --- VERSION CONFLICT CHECK ---
    if (incomingVersion !== currentVersion + 1) {
      return res.status(409).json({
        error: "Version conflict",
        expected: currentVersion + 1,
        received: incomingVersion
      });
    }

    const newData = {
      allTime,
      weekly,
      weeklyReset,
      weeklyHistory,
      version: currentVersion + 1
    };

    const content = Buffer.from(JSON.stringify(newData, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Update Chop Pig state",
      content,
      sha
    });

    return res.status(200).json({ success: true, version: currentVersion + 1 });
  } catch (err) {
    console.error("Save-state error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
