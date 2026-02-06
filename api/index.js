import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createDb } from '../db.js';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@watchearn.com').toLowerCase();

app.use(cors());
app.use(express.json());

function getTokenFromRequest(req) {
  const header = req.headers.authorization || '';
  const parts = header.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}

function signToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function ensureUserDefaults(user) {
  if (!user.role) {
    user.role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
  }
  if (!Array.isArray(user.purchases)) {
    user.purchases = [];
  }
  return user;
}

app.get('/api/hello', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Serverless backend working 🚀"
  });
});

async function loginHandler(req, res) {
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

    ensureUserDefaults(user);
    await db.write();

    const { password: _, ...userResponse } = user;
    const token = signToken(user);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

app.post('/login', loginHandler);
app.post('/api/login', loginHandler);

async function registerHandler(req, res) {
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

    db.data.users[normalizedEmail] = {
      name,
      email: normalizedEmail,
      password,
      role: normalizedEmail === ADMIN_EMAIL ? 'admin' : 'user',
      purchases: [],
      createdAt: new Date().toISOString()
    };
    await db.write();

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: { name, email: normalizedEmail, role: db.data.users[normalizedEmail].role }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

app.post('/register', registerHandler);
app.post('/api/register', registerHandler);

async function purchasePlanHandler(req, res) {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: "planId is required" });
    }

    const db = await createDb();
    const normalizedEmail = req.user.email.toLowerCase().trim();
    const user = db.data.users && db.data.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    ensureUserDefaults(user);
    const purchase = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      planId,
      purchasedAt: new Date().toISOString()
    };
    user.purchases.push(purchase);
    await db.write();

    return res.status(200).json({
      success: true,
      message: "Plan purchase successful",
      purchase
    });
  } catch (error) {
    console.error('Plan Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

app.post('/purchase-plan', requireAuth, purchasePlanHandler);
app.post('/api/plan', requireAuth, purchasePlanHandler);

async function adminUsersHandler(req, res) {
  try {
    const db = await createDb();
    const users = Object.values(db.data.users || {}).map((user) => {
      ensureUserDefaults(user);
      const { password: _, ...safeUser } = user;
      return safeUser;
    });
    await db.write();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Admin Users Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

app.get('/admin/users', requireAuth, requireAdmin, adminUsersHandler);
app.get('/api/admin/users', requireAuth, requireAdmin, adminUsersHandler);

app.get('/', (req, res) => {
  res.send('WebX Backend is running!');
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found. Please check your URL."
  });
});

export default app;

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
