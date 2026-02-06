/**
 * GET /api/hello
 * Simple health check for serverless backend
 */
export default function handler(req, res) {
  // --- CORS Configuration ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET request
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: "Serverless backend working 🚀"
    });
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
