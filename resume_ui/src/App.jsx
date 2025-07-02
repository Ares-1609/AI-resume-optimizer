import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    document.body.className = isDarkMode ? "dark-theme" : "light-theme";
  }, [isDarkMode]);

  const handleSubmit = async () => {
    if (!file) return alert("Please upload a PDF!");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setError("");
      setResult("");
      setScore(null);

      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.output);
        const match = data.output.match(/Score:\s*(\d+)\/10/);
        if (match) {
          setScore(parseInt(match[1]));
        }
      }
    } catch (err) {
      setError("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Resume Optimization Feedback", 20, 20);
    doc.setFontSize(11);
    doc.text(result, 20, 30, { maxWidth: 170 });
    doc.save("Resume_Feedback.pdf");
  };

  return (
    <div className="app-container">
      <div className="top-bar">
        <h2>📄 Resume Optimizer</h2>
        <button className="toggle-theme" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <p className="tagline">Get instant AI feedback to boost your resume</p>

      <input
        className="file-input"
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      {file && <p className="filename">📁 Selected: {file.name}</p>}

      <button className="analyze-button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {error && <p className="error-text">❌ {error}</p>}

      {score !== null && (
        <div className="score-bar">
          <span>Score: {score}/10</span>
          <div className="progress-bg">
            <div className="progress-fill" style={{ width: `${score * 10}%` }}></div>
          </div>
        </div>
      )}

      {result && (
        <div className="result-box">
          <h4>✅ AI Feedback:</h4>
          <pre>{result}</pre>
          <button className="pdf-btn" onClick={exportToPDF}>📤 Export to PDF</button>
        </div>
      )}
    </div>
  );
}

export default App;
