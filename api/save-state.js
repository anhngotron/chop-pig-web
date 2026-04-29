// api/save-state.js
// Vercel serverless function — saves state to GitHub with optimistic
// concurrency control.  Returns 409 if the client's _version is stale.

import { Octokit } from "@octokit/rest";

const OWNER = process.env.GITHUB_OWNER;   // e.g. "anhngotron"
const REPO  = process.env.GITHUB_REPO;    // e.g. "chop-pig-web"
const PATH  = "chop_pig_state_latest.json";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const password = req.headers["x-app-password"];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const body    = req.body;

  // ── 1. Fetch the current file from GitHub to get its real SHA ──
  let currentSha    = null;
  let currentVersion = null;

  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO, path: PATH
    });
    currentSha = data.sha;

    // Decode and extract _version stored inside the JSON
    const existing = JSON.parse(
      Buffer.from(data.content, "base64").toString("utf8")
    );
    currentVersion = existing._version || null;
  } catch (err) {
    if (err.status !== 404) throw err;
    // File doesn't exist yet — first save, allow it
  }

  // ── 2. Conflict check ──
  // If the file exists AND the client sent a version AND it doesn't
  // match what's on GitHub → reject with 409 Conflict.
  const clientVersion = body._version ?? null;

  if (currentSha && currentVersion && clientVersion &&
      clientVersion !== currentVersion) {
    return res.status(409).json({
      error:          "conflict",
      serverVersion:  currentVersion,
      clientVersion
    });
  }

  // ── 3. Build new payload with a fresh version token ──
  const newVersion = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const { _version: _stripped, ...stateData } = body;   // remove old _version
  const newPayload = { ...stateData, _version: newVersion };

  const content = Buffer
    .from(JSON.stringify(newPayload, null, 2))
    .toString("base64");

  // ── 4. Commit to GitHub ──
  await octokit.repos.createOrUpdateFileContents({
    owner:   OWNER,
    repo:    REPO,
    path:    PATH,
    message: `chore: update game state [${new Date().toISOString()}]`,
    content,
    ...(currentSha ? { sha: currentSha } : {})
  });

  return res.status(200).json({ ok: true, _version: newVersion });
}
