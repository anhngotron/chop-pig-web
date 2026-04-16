import { Octokit } from "@octokit/rest";

const OWNER = "anhngotron";
const REPO  = "chop-pig-web";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // List all files in the logs/ directory
    let files = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo:  REPO,
        path:  "logs"
      });
      files = Array.isArray(data) ? data : [];
    } catch (err) {
      // logs/ folder doesn't exist yet — return empty list
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ logs: [] });
    }

    // Sort newest first by filename (filenames are ISO timestamps)
    files.sort((a, b) => b.name.localeCompare(a.name));

    // Fetch each log file's content
    const logs = await Promise.all(
      files
        .filter(f => f.name.endsWith(".json"))
        .map(async (f) => {
          try {
            const { data: fileData } = await octokit.repos.getContent({
              owner: OWNER,
              repo:  REPO,
              path:  f.path
            });
            const text = Buffer.from(fileData.content, "base64").toString("utf8");
            return JSON.parse(text);
          } catch {
            return null;
          }
        })
    );

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    return res.status(200).json({ logs: logs.filter(Boolean) });
  } catch (err) {
    console.error("get-logs error:", err);
    return res.status(500).json({ error: err.message });
  }
}
