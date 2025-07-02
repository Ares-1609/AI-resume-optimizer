import React, { useState } from 'react';
import './UploadForm.css'; // Assuming you have some styles in this file

function UploadForm() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a file!");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // ✅ Log result in browser console
      console.log("🔍 Suggested Changes:", data.output);

      setResult(data.output);
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Something went wrong.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Optimize Resume</button>
      </form>

      {result && (
        <>
          <h3>Optimized Output:</h3>
          <textarea readOnly value={result} rows={12} cols={80}></textarea>
        </>
      )}
    </>
  );
}

export default UploadForm;
