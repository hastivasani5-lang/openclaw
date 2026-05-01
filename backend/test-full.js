require('dotenv').config();
const { processCandidate } = require('./brain');

(async () => {
  const profile = {
    name: "Hasti Vasani",
    email: process.env.GMAIL_USER,
    role: "Full Stack Developer",
    experience: "1-3 years",
    skills: "React, Node.js, Express, MongoDB"
  };

  console.log("🚀 Testing full pipeline for:", profile.name);
  try {
    const result = await processCandidate(profile);
    console.log("✅ Done! Task:", result.title);
    console.log("📧 Email with PDF sent to:", profile.email);
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
  process.exit(0);
})();
