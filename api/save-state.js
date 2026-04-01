import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const clientPassword = req.headers["x-app-password"];
  if (!clientPassword || clientPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "anhngotron";
  const repo = process.env.GITHUB_REPO || "chop-pig-web";
  const path = process.env.GITHUB_STATE_PATH || "chop_pig_state_latest.json";

  if (!token) {
    return res.status(500).json({ ok: false, error: "Missing GITHUB_TOKEN" });
  }

  const octokit = new Octokit({ auth: token });

  const content = Buffer.from(JSON.stringify(req.body, null, 2)).toString("base64");

  try {
    let sha = undefined;

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path
      });
      if (!Array.isArray(data) && data.sha) {
        sha = data.sha;
      }
    } catch (e) {
      // File may not exist yet — that's fine
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Update Chop Pig state",
      content,
      sha
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("GitHub save error:", err);
    return res.status(500).json({ ok: false, error: "GitHub save failed" });
  }
}