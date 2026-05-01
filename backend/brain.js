require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '')
  }
});

// 🔥 Generate task safely
async function generateTask(profile) {
  const prompt = `
You are a senior engineering manager.

Generate a practical task for this candidate:

Name: ${profile.name}
Role: ${profile.role}
Experience: ${profile.experience}
Skills: ${profile.skills}

Rules:
- Return ONLY valid JSON
- No markdown
- No explanation

Format:
{
  "title": "",
  "scenario": "",
  "requirements": [],
  "deliverables": [],
  "evaluation_criteria": [],
  "deadline_days": 3
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean response
    text = text.replace(/```json|```/g, '').trim();

    console.log("Gemini raw response:", text);

    return JSON.parse(text);

  } catch (err) {
    console.error("❌ Gemini parsing error:", err.message);

    // Fallback (so app never crashes)
    return {
      title: "Sample Task",
      scenario: "Create a simple CRUD app based on your skills.",
      requirements: ["Basic UI", "API integration"],
      deliverables: ["GitHub repo"],
      evaluation_criteria: ["Code quality", "Functionality"],
      deadline_days: 3
    };
  }
}

// 🔥 Main function
async function processCandidate(profile) {
  try {
    console.log("Processing candidate:", profile);

    const task = await generateTask(profile);

    console.log("Generated task:", task.title);

    await transporter.sendMail({
      from: `"Hiring Team" <${process.env.GMAIL_USER}>`,
      to: profile.email,
      subject: `Task for ${profile.role}`,
      html: `
        <h2>${task.title}</h2>
        <p>${task.scenario}</p>
        <p><b>Deadline:</b> ${task.deadline_days} days</p>
      `
    });

    console.log("✅ Email sent");

    return task;

  } catch (err) {
    console.error("❌ processCandidate error:", err.message);
    throw err;
  }
}

module.exports = { processCandidate };