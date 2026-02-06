import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/login
 * Body: { email, password }
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Read db.json
      const dbPath = path.join(process.cwd(), 'backend', 'data', 'db.json');
      const fileData = await fs.readFile(dbPath, 'utf8');
      const db = JSON.parse(fileData);

      const normalizedEmail = email.toLowerCase().trim();

      // Find user
      const user = db.users && db.users[normalizedEmail];

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Valid login - return user without password
      const { password: _, ...userResponse } = user;
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: userResponse
      });
    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
