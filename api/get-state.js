// api/get-state.js
// Vercel serverless function — reads the latest state from GitHub and
// forwards the _version token so the client can detect conflicts on save.

import { Octokit } from "@octokit/rest";

const OWNER = process.env.GITHUB_OWNER;
const REPO  = process.env.GITHUB_REPO;
const PATH  = "chop_pig_state_latest.json";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO, path: PATH
    });

    const raw   = Buffer.from(data.content, "base64").toString("utf8");
    const state = JSON.parse(raw);

    // No-cache headers so every browser always fetches fresh
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.status(200).json(state);   // _version is already inside state
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "not found" });
    console.error("get-state error:", err);
    return res.status(500).json({ error: "server error" });
  }
}
