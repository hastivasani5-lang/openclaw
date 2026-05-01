require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '')
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

// Smart skill-based fallback task generator
function generateFallbackTask(profile) {
  const skills = (profile.skills || "").toLowerCase();
  const exp = profile.experience || "0-1 years";
  const name = profile.name || "Candidate";
  const isFresher = exp.includes("0") || exp.includes("1");

  // Detect primary skill
  const isReact = skills.includes("react");
  const isNode = skills.includes("node") || skills.includes("express");
  const isPython = skills.includes("python");
  const isML = skills.includes("machine learning") || skills.includes("ml") || skills.includes("tensorflow") || skills.includes("pandas");
  const isFlutter = skills.includes("flutter") || skills.includes("dart");
  const isJava = skills.includes("java") && !skills.includes("javascript");
  const isSQL = skills.includes("sql") || skills.includes("database") || skills.includes("mysql") || skills.includes("postgres");
  const isDevOps = skills.includes("docker") || skills.includes("kubernetes") || skills.includes("aws") || skills.includes("devops");
  const isVue = skills.includes("vue");
  const isAngular = skills.includes("angular");

  if (isML || isPython && skills.includes("pandas")) {
    return {
      title: isFresher
        ? "Exploratory Data Analysis on a Real Dataset"
        : "Build a Predictive ML Model with API Endpoint",
      scenario: `You are a data scientist at a startup. ${isFresher
        ? `Your task is to perform EDA on a public dataset (e.g., Titanic or Iris), find patterns, and present insights using Python, Pandas, and Matplotlib.`
        : `Your task is to build a machine learning model that predicts customer churn. Expose it via a REST API using FastAPI or Flask.`}`,
      requirements: isFresher
        ? ["Load and clean a public dataset using Pandas", "Perform EDA with at least 5 visualizations", "Identify top 3 insights from the data", "Use Matplotlib or Seaborn for charts"]
        : ["Train a classification model (Random Forest or XGBoost)", "Achieve at least 80% accuracy on test set", "Expose prediction via REST API", "Include model evaluation metrics"],
      deliverables: ["Jupyter Notebook with full analysis", "GitHub repository", "README with findings summary"],
      evaluation_criteria: ["Data cleaning approach", "Quality of visualizations", "Insight depth", "Code readability"],
      deadline_days: 4
    };
  }

  if (isReact && isNode) {
    return {
      title: isFresher
        ? "Build a Full-Stack Todo App with React & Node.js"
        : "Build a Real-Time Collaborative Notes App",
      scenario: isFresher
        ? `You are a junior developer at a product company. Build a full-stack todo application where users can add, edit, delete, and mark tasks as complete. Use React for frontend and Node.js/Express for backend with a JSON file or MongoDB for storage.`
        : `You are a senior developer. Build a real-time collaborative notes app where multiple users can create and edit notes simultaneously. Use React, Node.js, Socket.io for real-time sync, and MongoDB for persistence.`,
      requirements: isFresher
        ? ["CRUD operations for todos", "React frontend with state management", "Node.js REST API", "Basic responsive UI"]
        : ["Real-time sync using WebSockets", "User authentication (JWT)", "Conflict resolution for simultaneous edits", "Responsive UI with React"],
      deliverables: ["GitHub repo with frontend and backend", "Live demo link (optional)", "README with setup steps"],
      evaluation_criteria: ["API design", "React component structure", "Code quality", "Error handling"],
      deadline_days: 3
    };
  }

  if (isReact) {
    return {
      title: isFresher
        ? "Build a Weather Dashboard using a Public API"
        : "Build a Multi-Step Form with Validation and State Management",
      scenario: isFresher
        ? `You are a frontend developer intern. Build a weather dashboard that fetches real-time weather data from OpenWeatherMap API and displays it in a clean UI with search functionality.`
        : `You are a frontend engineer. Build a complex multi-step job application form with field validation, progress tracking, conditional fields, and final review step before submission.`,
      requirements: isFresher
        ? ["Fetch weather from OpenWeatherMap API", "Search by city name", "Show temperature, humidity, wind speed", "Handle loading and error states"]
        : ["Multi-step form with 4+ steps", "Real-time validation on each field", "Progress indicator", "Final review screen before submit", "Accessible (ARIA labels)"],
      deliverables: ["GitHub repository", "Deployed link (Vercel/Netlify)", "README"],
      evaluation_criteria: ["Component reusability", "State management", "UI/UX quality", "Error handling"],
      deadline_days: 3
    };
  }

  if (isNode) {
    return {
      title: isFresher
        ? "Build a REST API for a Blog Platform"
        : "Build a Rate-Limited Authentication API with JWT",
      scenario: isFresher
        ? `You are a backend developer. Build a RESTful API for a blog platform where users can create, read, update, and delete blog posts. Use Node.js, Express, and MongoDB.`
        : `You are a backend engineer. Build a secure authentication API with JWT tokens, refresh token rotation, rate limiting, and role-based access control.`,
      requirements: isFresher
        ? ["CRUD endpoints for blog posts", "Input validation", "MongoDB integration", "Proper HTTP status codes"]
        : ["JWT access + refresh token flow", "Rate limiting (max 5 login attempts)", "Role-based routes (admin/user)", "Password hashing with bcrypt"],
      deliverables: ["GitHub repository", "Postman collection or API docs", "README with setup"],
      evaluation_criteria: ["API design", "Security practices", "Error handling", "Code structure"],
      deadline_days: 3
    };
  }

  if (isPython) {
    return {
      title: isFresher
        ? "Build a CLI Task Manager in Python"
        : "Build a Web Scraper with Data Pipeline",
      scenario: isFresher
        ? `You are a Python developer. Build a command-line task manager that allows users to add, list, complete, and delete tasks. Data should persist in a JSON file.`
        : `You are a Python engineer. Build a web scraper that collects job listings from a public site, cleans the data, stores it in SQLite, and generates a daily summary report.`,
      requirements: isFresher
        ? ["Add/list/complete/delete tasks via CLI", "Persist data in JSON file", "Filter tasks by status", "Clean code with functions"]
        : ["Scrape job listings with BeautifulSoup/Scrapy", "Store in SQLite database", "Schedule daily runs with cron/APScheduler", "Generate CSV/HTML report"],
      deliverables: ["GitHub repository", "README with usage instructions", "Sample output screenshot"],
      evaluation_criteria: ["Code structure", "Error handling", "Data persistence", "CLI usability"],
      deadline_days: 3
    };
  }

  if (isFlutter) {
    return {
      title: isFresher
        ? "Build a Flutter Expense Tracker App"
        : "Build a Flutter App with REST API Integration and Local Caching",
      scenario: isFresher
        ? `You are a mobile developer. Build a simple expense tracker app in Flutter where users can add, categorize, and view their expenses with a summary chart.`
        : `You are a Flutter developer. Build a news reader app that fetches articles from a public API, caches them locally using Hive or SharedPreferences, and works offline.`,
      requirements: isFresher
        ? ["Add/delete expenses", "Category filter", "Total summary", "Pie chart visualization"]
        : ["REST API integration", "Local caching for offline use", "Pull-to-refresh", "Clean architecture (BLoC or Provider)"],
      deliverables: ["GitHub repository", "APK or screenshots", "README"],
      evaluation_criteria: ["UI quality", "State management", "Code structure", "Performance"],
      deadline_days: 4
    };
  }

  if (isDevOps) {
    return {
      title: isFresher
        ? "Dockerize a Node.js Application"
        : "Build a CI/CD Pipeline with Docker and GitHub Actions",
      scenario: isFresher
        ? `You are a DevOps intern. Take an existing Node.js application and containerize it using Docker. Write a Dockerfile and docker-compose.yml for local development.`
        : `You are a DevOps engineer. Set up a complete CI/CD pipeline for a Node.js app using GitHub Actions — including lint, test, Docker build, and deploy to a cloud service.`,
      requirements: isFresher
        ? ["Write a Dockerfile for Node.js app", "docker-compose with app + MongoDB", "Environment variable handling", "README with run instructions"]
        : ["GitHub Actions workflow for CI", "Docker image build and push to DockerHub", "Automated tests in pipeline", "Deploy to Render/Railway on merge to main"],
      deliverables: ["GitHub repository", "Working Docker setup", "README"],
      evaluation_criteria: ["Dockerfile quality", "Pipeline reliability", "Security (no secrets in code)", "Documentation"],
      deadline_days: 4
    };
  }

  if (isSQL) {
    return {
      title: isFresher
        ? "Design a Database Schema for an E-Commerce Platform"
        : "Build a Data Analytics Dashboard with SQL and Visualization",
      scenario: isFresher
        ? `You are a database developer. Design and implement a normalized database schema for an e-commerce platform with users, products, orders, and reviews.`
        : `You are a data engineer. Build an analytics dashboard that queries a sales database, generates KPI metrics, and visualizes them using Python or a BI tool.`,
      requirements: isFresher
        ? ["ER diagram with 5+ tables", "Proper foreign keys and indexes", "10+ sample SQL queries", "Normalization up to 3NF"]
        : ["Complex SQL queries with JOINs and CTEs", "KPI metrics (revenue, churn, growth)", "Visualization with Matplotlib or Tableau", "Performance optimization"],
      deliverables: ["SQL schema file", "Query file with comments", "README or report"],
      evaluation_criteria: ["Schema design", "Query efficiency", "Data integrity", "Documentation"],
      deadline_days: 3
    };
  }

  // Generic fallback
  const primarySkill = (profile.skills || "programming").split(',')[0].trim();
  return {
    title: `Build a ${primarySkill} Portfolio Project`,
    scenario: `You are a developer with expertise in ${profile.skills}. Build a meaningful project that showcases your skills and solves a real-world problem. The project should demonstrate your ability to design, develop, and document software.`,
    requirements: [
      `Use ${primarySkill} as the primary technology`,
      "Implement at least 3 core features",
      "Write clean, well-documented code",
      "Include proper error handling"
    ],
    deliverables: [
      "GitHub repository with source code",
      "README with setup and usage instructions",
      "Working demo or screenshots"
    ],
    evaluation_criteria: [
      "Code quality and structure",
      "Feature completeness",
      "Documentation quality",
      "Problem-solving approach"
    ],
    deadline_days: 3
  };
}

// Generate unique task using Gemini
async function generateTask(profile) {
  const prompt = `You are a senior engineering manager at a tech company.

Generate a UNIQUE and SPECIFIC practical assignment task for this candidate.
Make it highly personalized based on their exact skills and experience level.
Every candidate must get a DIFFERENT task — do not repeat generic tasks.

Candidate Profile:
- Name: ${profile.name}
- Role: ${profile.role}
- Experience: ${profile.experience}
- Skills: ${profile.skills}

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no code blocks
- Task must be specific to their skills: ${profile.skills}
- Make it realistic and challenging but achievable for ${profile.experience} experience level
- Be creative and unique

Return ONLY this JSON (no extra text):
{"title":"specific task title","scenario":"detailed real-world scenario (3-4 sentences)","requirements":["req1","req2","req3","req4"],"deliverables":["del1","del2","del3"],"evaluation_criteria":["crit1","crit2","crit3"],"deadline_days":3}`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    // Strip any markdown code fences
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    // Extract JSON if there's extra text around it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("✅ Gemini task generated for:", profile.name, "→", parsed.title);
    return parsed;

  } catch (err) {
    if (err.status === 429) {
      console.warn("⚠️  Gemini quota exceeded — using smart fallback task generator");
    } else if (err.status === 404) {
      console.warn("⚠️  Gemini model not found — using smart fallback task generator");
    } else {
      console.error("❌ Gemini error:", err.message, "— using fallback");
    }
    return generateFallbackTask(profile);
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
    try {
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
    } catch (emailErr) {
      // Email failed but task was generated — don't crash the whole request
      console.error("❌ Email send failed:", emailErr.message);
    }

    return task;

  } catch (err) {
    console.error("❌ processCandidate error:", err.message);
    throw err;
  }
}

module.exports = { processCandidate };
