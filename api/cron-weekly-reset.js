import { Octokit } from "@octokit/rest";

const OWNER = "anhngotron";
const REPO = "chop-pig-web";
const FILE_PATH = "chop_pig_state_latest.json";

export default async function handler(req, res) {
  // Vercel calls cron jobs with GET. Block any other method.
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect the endpoint so only Vercel's cron runner can trigger it.
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1. Fetch the current state from GitHub
    const { data: fileData } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
    });

    const content = Buffer.from(fileData.content, "base64").toString("utf8");
    const state = JSON.parse(content);

    // 2. Archive the current weekly into weeklyHistory
    const now = new Date();
    const weeklyHistory = state.weeklyHistory || [];

    weeklyHistory.push({
      weekStart: state.weeklyReset || now.toISOString(),
      weekEnd: now.toISOString(),
      players: state.weekly?.players || {},
      playerList: state.weekly?.playerList || [],
    });

    // 3. Build the reset state — zero out weekly, keep allTime intact
    const newState = {
      ...state,
      weekly: {
        players: Object.fromEntries(
          (state.allTime?.playerList || []).map((name) => [
            name,
            { score: 0, games: 0, wins: 0 },
          ])
        ),
        playerList: state.allTime?.playerList || [],
      },
      weeklyReset: now.toISOString(),
      weeklyHistory,
    };

    // 4. Write it back to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      message: `chore: weekly reset ${now.toISOString().slice(0, 10)}`,
      content: Buffer.from(JSON.stringify(newState, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return res.status(200).json({
      ok: true,
      message: `Weekly reset complete for week starting ${now.toISOString().slice(0, 10)}`,
    });
  } catch (err) {
    console.error("Cron weekly reset failed:", err);
    return res.status(500).json({ error: err.message });
  }
}