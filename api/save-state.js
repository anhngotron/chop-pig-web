import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // -------------------------------
    // 1. Password Protection
    // -------------------------------
    const adminPassword = process.env.ADMIN_PASSWORD;
    const provided = req.headers["x-app-password"];

    if (!provided || provided !== adminPassword) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // -------------------------------
    // 2. Validate incoming data
    // -------------------------------
    const {
      players,
      playerList,
      weeklyPlayers,
      weeklyHistory,
      currentWeekId
    } = req.body;

    if (
      !players ||
      !playerList ||
      !weeklyPlayers ||
      !weeklyHistory ||
      !currentWeekId
    ) {
      return res.status(400).json({
        error: "Invalid payload — missing weekly fields"
      });
    }

    // -------------------------------
    // 3. GitHub Setup
    // -------------------------------
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({
        error: "Missing GitHub environment variables"
      });
    }

    const octokit = new Octokit({ auth: token });
    const path = "chop_pig_state_latest.json";

    // -------------------------------
    // 4. Get current file SHA
    // -------------------------------
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path
      });
      sha = data.sha;
    } catch (err) {
      sha = null; // first save
    }

    // -------------------------------
    // 5. Commit new JSON
    // -------------------------------
    const content = Buffer.from(
      JSON.stringify(
        {
          players,
          playerList,
          weeklyPlayers,
          weeklyHistory,
          currentWeekId
        },
        null,
        2
      )
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Update Chop Pig state",
      content,
      sha
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Save-state error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
