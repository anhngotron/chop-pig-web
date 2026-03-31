// api/save-state.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;

    // Expecting: { players: {...}, playerList: [...] }
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { players, playerList } = body;

    const repoOwner = process.env.GITHUB_OWNER;      // e.g. "your-username"
    const repoName = process.env.GITHUB_REPO;        // e.g. "chop-pig-data"
    const filePath = "chop_pig_state.json";          // path inside repo
    const token = process.env.GITHUB_TOKEN;          // GitHub PAT

    if (!repoOwner || !repoName || !token) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const contentJson = JSON.stringify({ players, playerList }, null, 2);
    const contentBase64 = Buffer.from(contentJson).toString("base64");

    // 1) Get current file (to obtain SHA, if it exists)
    const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    let sha = null;
    const getResp = await fetch(apiBase, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "chop-pig-app"
      }
    });

    if (getResp.status === 200) {
      const existing = await getResp.json();
      sha = existing.sha;
    } else if (getResp.status !== 404) {
      const text = await getResp.text();
      return res.status(500).json({ error: "Failed to read file", details: text });
    }

    // 2) Create or update file
    const commitMessage = "Update Chop Pig autosave state";

    const putResp = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "chop-pig-app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentBase64,
        sha: sha || undefined
      })
    });

    if (!putResp.ok) {
      const text = await putResp.text();
      return res.status(500).json({ error: "Failed to write file", details: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected error" });
  }
}