require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { processCandidate } = require('./brain');

const app = express();

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://openclaw-seven-gold.vercel.app',
  /\.vercel\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
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

app.options('/{*path}', cors());

// Body parsers — only for non-multipart requests
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) return next(); // skip for file uploads
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) return next();
  express.urlencoded({ extended: true })(req, res, next);
});

// Health check
app.get('/', (_req, res) => {
  res.send('✅ Backend is running');
});

// Helper: parse multipart/form-data manually
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    let body = Buffer.alloc(0);
    req.on('data', chunk => { body = Buffer.concat([body, chunk]); });
    req.on('end', () => {
      try {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (!boundaryMatch) return resolve({ fields: {}, resumeBuffer: null, resumeFilename: null });

        const boundary = boundaryMatch[1].trim();
        const fields = {};
        let resumeBuffer = null;
        let resumeFilename = null;

        // Split by boundary
        const delimiter = Buffer.from(`--${boundary}`);
        const parts = splitBuffer(body, delimiter);

        for (const part of parts) {
          if (!part || part.length < 4) continue;
          const str = part.toString('binary');
          const headerEnd = str.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;

          const headerStr = str.substring(0, headerEnd);
          const contentBytes = part.slice(headerEnd + 4);
          // Remove trailing \r\n
          const valueBytes = contentBytes.slice(0, contentBytes.length - 2);

          const nameMatch = headerStr.match(/name="([^"]+)"/);
          const filenameMatch = headerStr.match(/filename="([^"]+)"/);

          if (!nameMatch) continue;
          const fieldName = nameMatch[1];

          if (filenameMatch) {
            // File field
            if (headerStr.includes('application/pdf')) {
              resumeFilename = filenameMatch[1];
              resumeBuffer = valueBytes;
            }
          } else {
            // Text field
            fields[fieldName] = valueBytes.toString('utf8');
          }
        }

        resolve({ fields, resumeBuffer, resumeFilename });
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function splitBuffer(buf, delimiter) {
  const parts = [];
  let start = 0;
  while (start < buf.length) {
    const idx = buf.indexOf(delimiter, start);
    if (idx === -1) break;
    if (idx > start) parts.push(buf.slice(start, idx));
    start = idx + delimiter.length;
    // skip \r\n after boundary
    if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;
    // stop at --boundary--
    if (buf[start] === 0x2d && buf[start + 1] === 0x2d) break;
  }
  return parts;
}

// Apply route
app.post('/api/apply', async (req, res) => {
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: "Request timed out. Please try again." });
    }
  }, 30000);

  try {
    let fields = {};
    let resumeBuffer = null;
    let resumeFilename = null;

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const parsed = await parseMultipart(req);
      fields = parsed.fields;
      resumeBuffer = parsed.resumeBuffer;
      resumeFilename = parsed.resumeFilename;
    } else {
      fields = req.body || {};
    }

    console.log("📥 Fields received:", JSON.stringify(fields));

    const profile = {
      name: fields.name || "Unknown",
      email: fields.email || "",
      role: fields.role || "Developer",
      experience: fields.experience || "0",
      skills: fields.skills || "Not specified",
      resumeBuffer,
      resumeFilename,
    };

    if (!profile.email) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await processCandidate(profile);

    clearTimeout(requestTimeout);
    if (!res.headersSent) {
      res.json({ 
        success: true, 
        task: result.title || "Task generated",
        emailError: result._emailError || null
      });
    }

  } catch (err) {
    clearTimeout(requestTimeout);
    console.error("❌ Server error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong", details: err.message });
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
