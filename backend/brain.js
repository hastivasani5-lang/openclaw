require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

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

// Generate PDF buffer from task
function generatePDF(task, profile) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(22)
      .fillColor('#1e293b')
      .text('OpenClaw — Candidate Task', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor('#64748b')
      .text(`Candidate: ${profile.name}  |  Role: ${profile.role}  |  Experience: ${profile.experience}`, { align: 'center' });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1);

    // Task Title
    doc
      .fontSize(16)
      .fillColor('#0f172a')
      .text(task.title);

    doc.moveDown(0.5);

    // Scenario
    doc
      .fontSize(12)
      .fillColor('#334155')
      .text('Scenario:', { underline: true });
    doc
      .fontSize(11)
      .fillColor('#475569')
      .text(task.scenario);

    doc.moveDown(0.8);

    // Requirements
    if (task.requirements && task.requirements.length > 0) {
      doc.fontSize(12).fillColor('#334155').text('Requirements:', { underline: true });
      task.requirements.forEach((req, i) => {
        doc.fontSize(11).fillColor('#475569').text(`  ${i + 1}. ${req}`);
      });
      doc.moveDown(0.8);
    }

    // Deliverables
    if (task.deliverables && task.deliverables.length > 0) {
      doc.fontSize(12).fillColor('#334155').text('Deliverables:', { underline: true });
      task.deliverables.forEach((del, i) => {
        doc.fontSize(11).fillColor('#475569').text(`  ${i + 1}. ${del}`);
      });
      doc.moveDown(0.8);
    }

    // Evaluation Criteria
    if (task.evaluation_criteria && task.evaluation_criteria.length > 0) {
      doc.fontSize(12).fillColor('#334155').text('Evaluation Criteria:', { underline: true });
      task.evaluation_criteria.forEach((crit, i) => {
        doc.fontSize(11).fillColor('#475569').text(`  ${i + 1}. ${crit}`);
      });
      doc.moveDown(0.8);
    }

    // Deadline
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor('#6366f1')
      .text(`Deadline: ${task.deadline_days} days`, { align: 'right' });

    doc.end();
  });
}

// Generate unique task using Gemini
async function generateTask(profile) {
  const prompt = `
You are a senior engineering manager at a tech company.

Generate a UNIQUE and SPECIFIC practical assignment task for this candidate.
Make it highly personalized based on their exact skills and experience level.
Every candidate must get a DIFFERENT task — do not repeat generic tasks.

Candidate Profile:
- Name: ${profile.name}
- Role: ${profile.role}
- Experience: ${profile.experience}
- Skills: ${profile.skills}

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- Task must be specific to their skills: ${profile.skills}
- Make it realistic and challenging but achievable in ${profile.experience} experience level
- Be creative and unique — no two candidates should get the same task

JSON Format:
{
  "title": "specific task title based on their skills",
  "scenario": "detailed real-world scenario description (3-4 sentences)",
  "requirements": ["requirement 1", "requirement 2", "requirement 3", "requirement 4"],
  "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
  "evaluation_criteria": ["criteria 1", "criteria 2", "criteria 3"],
  "deadline_days": 3
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json|```/g, '').trim();
    console.log("✅ Gemini task generated for:", profile.name);
    return JSON.parse(text);

  } catch (err) {
    console.error("❌ Gemini error:", err.message);

    // Skill-based fallback so at least different tasks per skill set
    const skillList = profile.skills || "general programming";
    return {
      title: `Build a ${skillList.split(',')[0].trim()} Project`,
      scenario: `You are tasked with building a real-world application using your ${skillList} skills. This project should demonstrate your ability to design, develop, and deploy a functional solution.`,
      requirements: [
        `Use ${skillList.split(',')[0].trim()} as the primary technology`,
        "Implement proper error handling",
        "Write clean, documented code",
        "Include a README with setup instructions"
      ],
      deliverables: [
        "GitHub repository with source code",
        "Working demo or screenshots",
        "README with documentation"
      ],
      evaluation_criteria: [
        "Code quality and structure",
        "Functionality and completeness",
        "Documentation quality"
      ],
      deadline_days: 3
    };
  }
}

// Main function
async function processCandidate(profile) {
  try {
    console.log("Processing candidate:", profile);

    const task = await generateTask(profile);
    console.log("Generated task:", task.title);

    // Generate PDF
    const pdfBuffer = await generatePDF(task, profile);
    console.log("✅ PDF generated");

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"OpenClaw Hiring" <${process.env.GMAIL_USER}>`,
      to: profile.email,
      subject: `Your Assignment Task — ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Hi ${profile.name},</h2>
          <p style="color: #475569;">Thank you for applying! We've prepared a personalized assignment for you.</p>
          <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #0f172a; margin: 0 0 8px 0;">${task.title}</h3>
            <p style="color: #64748b; margin: 0;">${task.scenario}</p>
          </div>
          <p style="color: #475569;">📎 Please find the complete task details in the attached PDF.</p>
          <p style="color: #475569;"><strong>Deadline:</strong> ${task.deadline_days} days</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 12px;">OpenClaw Hiring Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `task-${profile.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("✅ Email sent with PDF to:", profile.email);
    return task;

  } catch (err) {
    console.error("❌ processCandidate error:", err.message);
    throw err;
  }
}

module.exports = { processCandidate };
