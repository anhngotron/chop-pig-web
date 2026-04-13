import { Octokit } from "@octokit/rest";

const OWNER = "anhngotron";
const REPO  = "chop-pig-web";
const PATH  = "chop_pig_state_latest.json";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data: fileData } = await octokit.repos.getContent({
      owner: OWNER,
      repo:  REPO,
      path:  PATH,
    });

    const content = Buffer.from(fileData.content, "base64").toString("utf8");
    const state   = JSON.parse(content);

    // Tell every cache layer (browser, CDN, Vercel edge) never to cache this
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    return res.status(200).json(state);
  } catch (err) {
    console.error("get-state error:", err);
    return res.status(500).json({ error: err.message });
  }
}
