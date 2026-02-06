import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createDb } from '../db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

function addApproval(db, payload) {
  const approval = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...payload
  };
  db.data.approvals.push(approval);
  return approval;
}

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

    addApproval(db, { type: 'login', email: normalizedEmail });
    await db.write();

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

    db.data.users[normalizedEmail] = {
      name,
      email: normalizedEmail,
      password,
      approved: false,
      createdAt: new Date().toISOString()
    };
    addApproval(db, { type: 'signup', email: normalizedEmail, name });
    await db.write();

    return res.status(201).json({
      success: true,
      message: "Registration submitted for approval",
      user: { name, email: normalizedEmail, approved: false }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { email, planId } = req.body;
    if (!email || !planId) {
      return res.status(400).json({ error: "Email and planId are required" });
    }

    const db = await createDb();
    const normalizedEmail = email.toLowerCase().trim();
    const user = db.data.users && db.data.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.planId = planId;
    addApproval(db, { type: 'plan', email: normalizedEmail, planId });
    await db.write();

    return res.status(200).json({
      success: true,
      message: "Plan submitted for approval",
      planId
    });
  } catch (error) {
    console.error('Plan Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/admin/approvals', async (req, res) => {
  try {
    const db = await createDb();
    return res.status(200).json({
      success: true,
      approvals: db.data.approvals || []
    });
  } catch (error) {
    console.error('Approvals Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/admin/approve', async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: "id and status are required" });
    }

    const db = await createDb();
    const approval = (db.data.approvals || []).find((a) => a.id === id);
    if (!approval) {
      return res.status(404).json({ error: "Approval not found" });
    }

    approval.status = status;
    approval.updatedAt = new Date().toISOString();
    if (approval.type === 'signup' && approval.email) {
      const user = db.data.users && db.data.users[approval.email];
      if (user) {
        user.approved = status === 'approved';
      }
    }

    await db.write();
    return res.status(200).json({ success: true, approval });
  } catch (error) {
    console.error('Approve Error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

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
