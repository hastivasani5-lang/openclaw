require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { processCandidate } = require('./brain');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (important for testing)
app.get('/', (req, res) => {
  res.send('✅ Backend is running');
});

// Apply route
app.post('/api/apply', async (req, res) => {
  try {
    console.log("📥 Incoming request:", req.body);

    // ✅ Safe data mapping (prevents undefined errors)
    const profile = {
      name: req.body.name || "Unknown",
      email: req.body.email || "",
      role: req.body.role || "Developer",
      experience: req.body.experience || "0",
      skills: req.body.skills || "Not specified"
    };

    // ❌ Basic validation
    if (!profile.email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await processCandidate(profile);

    res.json({
      success: true,
      task: result.title || "Task generated"
    });

  } catch (err) {
    console.error("❌ Server error:", err.message);

    res.status(500).json({
      error: "Something went wrong",
      details: err.message
    });
  }
});

// Server start
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});