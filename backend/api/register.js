import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/register
 * Body: { name, email, password }
 */
export default async function handler(req, res) {
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

  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Read db.json
      const dbPath = path.join(process.cwd(), 'backend', 'data', 'db.json');
      const fileData = await fs.readFile(dbPath, 'utf8');
      const db = JSON.parse(fileData);

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      if (db.users && db.users[normalizedEmail]) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Success (Mock registration - no write)
      return res.status(201).json({
        success: true,
        message: "Registration successful (Mock)",
        user: { name, email: normalizedEmail }
      });
    } catch (error) {
      console.error('Registration Error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
