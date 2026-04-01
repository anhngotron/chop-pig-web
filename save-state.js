export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { players, playerList } = body;

    const repoOwner = process.env.GITHUB_OWNER;
    const repoName = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!repoOwner || !repoName || !token) {
      return res.status(500).json({ error: "Server not configured" });
    }

    // Timestamp for history files
    function timestamp() {
      const d = new Date();
      const pad = n => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    }

    const latestPath = "chop_pig_state_latest.json";
    const historyPath = `history/chop_pig_state_${timestamp()}.json`;

    const contentJson = JSON.stringify({ players, playerList }, null, 2);
    const contentBase64 = Buffer.from(contentJson).toString("base64");

    async function writeFile(path, message) {
      const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

      // Check if file exists (to get SHA)
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
        throw new Error(`Failed to read file: ${text}`);
      }

      // Write file
      const putResp = await fetch(apiBase, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "chop-pig-app",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          content: contentBase64,
          sha: sha || undefined
        })
      });

      if (!putResp.ok) {
        const text = await putResp.text();
        throw new Error(`Failed to write file: ${text}`);
      }
    }

    // 1. Write latest.json
    await writeFile(latestPath, "Update latest Chop Pig autosave");

    // 2. Write timestamped history file
    await writeFile(historyPath, "Add versioned Chop Pig autosave");

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}