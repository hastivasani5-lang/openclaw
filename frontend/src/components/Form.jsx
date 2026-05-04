import { useState } from "react";
import axios from "axios";

export default function Form() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    skills: "",
  });

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgColor, setMsgColor] = useState("#94a3b8");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "application/pdf") {
      setMsg("❌ Only PDF files are allowed");
      setMsgColor("#f87171");
      e.target.value = "";
      setResume(null);
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setMsg("❌ File size must be under 5MB");
      setMsgColor("#f87171");
      e.target.value = "";
      setResume(null);
      return;
    }
    setResume(file || null);
    setMsg("");
  };

  const submit = async () => {
    // Frontend validation
    if (!form.name) {
      setMsg("❌ Full name is required");
      setMsgColor("#f87171");
      return;
    }
    if (!form.email) {
      setMsg("❌ Email is required");
      setMsgColor("#f87171");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

      // Use FormData to send file + fields together
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("experience", form.experience);
      formData.append("skills", form.skills);
      if (resume) {
        formData.append("resume", resume);
      }

      const res = await axios.post(`${backendUrl}/api/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.emailError) {
        setMsg("⚠️ Task generated but email failed: " + res.data.emailError);
        setMsgColor("#facc15");
      } else {
        setMsg("✅ Task generated! Check your email: " + res.data.task);
        setMsgColor("#4ade80");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message;
      setMsg("❌ Error: " + errMsg);
      setMsgColor("#f87171");
      console.error("Submit error:", err.response?.data || err.message);
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #475569",
    backgroundColor: "#334155",
    color: "white",
    marginTop: "5px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #0f172a, #1e293b)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          backgroundColor: "#1e293b",
          borderRadius: "16px",
          padding: "30px",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ fontSize: "28px", marginBottom: "5px" }}>Apply Now</h2>

        <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
          Fill in your details and we'll send a personalized task to your email.
        </p>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          {/* Name */}
          <div>
            <label>Full Name *</label>
            <input
              name="name"
              value={form.name}
              placeholder="John Doe"
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label>Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              placeholder="john@example.com"
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label>Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              placeholder="+91 98765 43210"
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Experience */}
          <div>
            <label>Experience *</label>
            <select
              name="experience"
              value={form.experience}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select experience</option>
              <option>0-1 years</option>
              <option>1-3 years</option>
              <option>3-5 years</option>
              <option>5+ years</option>
            </select>
          </div>
        </div>

        {/* Skills */}
        <div style={{ marginTop: "15px" }}>
          <label>Skills *</label>
          <input
            name="skills"
            value={form.skills}
            placeholder="React, Node.js, MongoDB..."
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Resume Upload */}
        <div style={{ marginTop: "15px" }}>
          <label>Resume (PDF)</label>
          <div
            style={{
              marginTop: "5px",
              border: "2px dashed #475569",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#273549",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleResumeChange}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
                width: "100%",
                height: "100%",
              }}
            />
            {resume ? (
              <p style={{ color: "#4ade80", margin: 0, fontSize: "14px" }}>
                📄 {resume.name}
              </p>
            ) : (
              <>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
                  📎 Click to upload your resume
                </p>
                <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "12px" }}>
                  PDF only · Max 5MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: loading
              ? "linear-gradient(to right, #475569, #64748b)"
              : "linear-gradient(to right, #2563eb, #3b82f6)",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Submit Application →"}
        </button>

        {/* Message */}
        {msg && (
          <p style={{ marginTop: "15px", color: msgColor, fontSize: "14px" }}>
            {msg}
          </p>
        )}

        {/* Footer */}
        <p
          style={{
            marginTop: "20px",
            fontSize: "12px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          🔒 Your data is secure. A personalized task will be sent to your email.
        </p>
      </div>
    </div>
  );
}
