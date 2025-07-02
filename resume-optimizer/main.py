from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from pdf2image import convert_from_path
import pytesseract
import os

# --- API Key for Gemini ---
GEMINI_API_KEY = "AIzaSyBaXMiy1DrW6ii7khhOL-71syKE4hcm0Q8"  # replace with your actual API key
genai.configure(api_key=GEMINI_API_KEY)

# --- Google Gemini Model ---
model = genai.GenerativeModel("models/gemini-1.5-flash-latest")
  # ✅ available and supported


# --- Tesseract Path ---
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # update if installed elsewhere

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- OCR from PDF ---
def extract_text_from_pdf(pdf_path):
    pages = convert_from_path(pdf_path, dpi=300)
    full_text = ""
    for page in pages:
        text = pytesseract.image_to_string(page)
        full_text += text + "\n"
    return full_text

def clean_text(text):
    lines = text.split('\n')
    clean_lines = [line.strip() for line in lines if line.strip()]
    return '\n'.join(clean_lines)

# --- Prompt Builder ---
def build_prompt(resume_text):
    return f"""
You are a professional resume reviewer.

Read the resume below and provide:
1. A score out of 10, based on clarity, formatting, content, and relevance.
2. Three detailed and actionable suggestions for improvement.

Format the output exactly like this:
Score: <number>/10  
Suggestions:
1. ...
2. ...
3. ...

Resume Text:
\"\"\"
{resume_text}
\"\"\"
"""

# --- Main Endpoint ---
@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    try:
        if 'resume' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['resume']
        filename = file.filename
        if not filename.endswith(".pdf"):
            return jsonify({"error": "Only .pdf files are supported"}), 400

        # Save the uploaded file
        save_path = os.path.join("uploads", filename)
        os.makedirs("uploads", exist_ok=True)
        file.save(save_path)

        # OCR extraction and cleaning
        raw_text = extract_text_from_pdf(save_path)
        resume_text = clean_text(raw_text)[:3000]  # limit to avoid long prompt
        prompt = build_prompt(resume_text)

        # Generate response using Gemini
        response = model.generate_content(prompt)
        generated_text = response.text
        print("📤 Gemini Output:\n", generated_text)

        return jsonify({"output": generated_text})

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 500

# --- Run Flask App ---
if __name__ == '__main__':
    app.run(debug=True)
