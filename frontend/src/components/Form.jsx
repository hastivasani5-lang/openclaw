import { useState } from "react";
import axios from "axios";

export default function Form() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    skills: "",
    portfolio: ""
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    setLoading(true);
    setMsg("");

    // Frontend validation
    if (!form.email) {
      setMsg("❌ Email is required");
      setLoading(false);
      return;
    }
    if (!form.name) {
      setMsg("❌ Full name is required");
      setLoading(false);
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      console.log("Submitting to:", backendUrl, "with data:", form);
      const res = await axios.post(`${backendUrl}/api/apply`, form);
      setMsg("✅ Task generated: " + res.data.task);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.details || err.message;
      setMsg("❌ Error: " + errMsg);
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
    outline: "none"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #0f172a, #1e293b)",
        padding: "20px"
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
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}
      >
        <h2 style={{ fontSize: "28px", marginBottom: "5px" }}>
          Apply Now
        </h2>

        <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
          Fill in your details and we'll send a custom task to your email.
        </p>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px"
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
            <label>Phone Number *</label>
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

        {/* Portfolio */}
        <div style={{ marginTop: "15px" }}>
          <label>Portfolio / GitHub Link</label>
          <input
            name="portfolio"
            value={form.portfolio}
            placeholder="https://github.com/yourprofile"
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Button */}
        <button
          onClick={submit}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(to right, #2563eb, #3b82f6)",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {loading ? "Generating..." : "Submit Application →"}
        </button>

        {/* Message */}
        {msg && (
          <p style={{ marginTop: "15px", color: "#94a3b8" }}>
            {msg}
          </p>
        )}

        {/* Footer */}
        <p
          style={{
            marginTop: "20px",
            fontSize: "12px",
            color: "#64748b",
            textAlign: "center"
          }}
        >
          🔒 Your data is secure. A personalized task will be sent to your email.
        </p>
      </div>
    </div>
  );
}