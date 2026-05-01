require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { processCandidate } = require('./brain');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://openclaw-seven-gold.vercel.app',
  // allow any vercel preview deployments
  /\.vercel\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('/{*path}', cors());

app.use(express.json());

// Health check route (important for testing)
app.get('/', (req, res) => {
  res.send('✅ Backend is running');
});

// Apply route
app.post('/api/apply', async (req, res) => {
  // Overall 30 second timeout for the entire request
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: "Request timed out. Please try again." });
    }
  }, 30000);

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

    // Basic validation
    if (!profile.email) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await processCandidate(profile);

    clearTimeout(requestTimeout);
    if (!res.headersSent) {
      res.json({
        success: true,
        task: result.title || "Task generated"
      });
    }

  } catch (err) {
    clearTimeout(requestTimeout);
    console.error("❌ Server error:", err.message);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Something went wrong",
        details: err.message
      });
    }
  }
});

// Server start
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});