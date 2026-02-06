import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createDb } from '../db.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/hello', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Serverless backend working 🚀"
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = await createDb();
    const normalizedEmail = email.toLowerCase().trim();
    const user = db.data.users && db.data.users[normalizedEmail];

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

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
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await createDb();
    const normalizedEmail = email.toLowerCase().trim();

    if (db.data.users && db.data.users[normalizedEmail]) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Mock registration for now as per original code
    return res.status(201).json({
      success: true,
      message: "Registration successful (Mock)",
      user: { name, email: normalizedEmail }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('WebX Backend is running!');
});

// Catch-all route for undefined routes to prevent 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found. Please check your URL."
  });
});

// Export the app for Vercel
export default app;

// For local development
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
