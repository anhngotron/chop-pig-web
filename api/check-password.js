export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get password from environment variable
  const correctPassword = process.env.APP_PASSWORD;

  // Check if environment variable is set
  if (!correctPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Get password from request body
  const { password } = req.body;

  // Validate password
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  // Compare passwords
  if (password === correctPassword) {
    res.status(200).json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
}