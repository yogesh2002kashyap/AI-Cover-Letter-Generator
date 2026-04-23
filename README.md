# CoverCraft — AI Cover Letter Generator

![AI Powered](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

A full-stack AI-powered cover letter generator that creates personalized, professional cover letters using Google Gemini. Upload your resume PDF and paste a job description to get a highly tailored letter in seconds.

---

## Features

- **AI-Generated Letters** — Powered by Google Gemini 2.5 Flash
- **PDF Resume Parsing** — Extracts text from uploaded resumes automatically
- **Job Description Tailoring** — Matches your experience to the specific role
- **Download as PDF** — Export the generated letter with one click
- **Copy to Clipboard** — Instant copy for pasting anywhere
- **Secure API Key Handling** — Key stored in `.env`, never exposed to frontend
- **Full Error Handling** — Validates file type, size, scanned PDFs, and API failures

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| AI Model | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| PDF Upload | Multer |
| PDF Parsing | pdfreader |
| PDF Export | jsPDF |
| Config | dotenv |

---

## Project Structure

```
AI Cover Letter Generator/
├── public/
│   ├── index.html       # UI — form, output panel, footer
│   ├── script.js        # Frontend logic — fetch, PDF extract, download
│   └── style.css        # All styles — design tokens, layout, components
├── .env                 # API key (never commit this)
├── .gitignore           # Excludes .env and node_modules
├── geminiService.js     # Prompt engineering + Gemini API call
├── server.js            # Express server — routes, multer, PDF parsing
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A Google Gemini API key (free) → https://aistudio.google.com/

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yogesh2002kasyap/cover-letter-generator.git
cd cover-letter-generator

# 2. Install dependencies
npm install

# 3. Create your .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# 4. Start the server
node server.js
```

### Usage

1. Open your browser at `http://localhost:3000`
2. Fill in your **Name**, **Job Role**, **Company**, and **Key Skills**
3. Optionally upload your **Resume PDF** for personalization
4. Optionally paste the **Job Description** for targeted tailoring
5. Click **Generate Cover Letter**
6. Copy or download the result

---

## Environment Variables

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Important:** Never commit your `.env` file. It is listed in `.gitignore` by default.

---

## API Endpoints

### `POST /extract-pdf`
Accepts a PDF file upload and returns extracted text.

**Request:** `multipart/form-data` with field name `resume`

**Response:**
```json
{
  "success": true,
  "text": "Extracted resume text..."
}
```

---

### `POST /generate-letter`
Generates a cover letter using Gemini AI.

**Request body:**
```json
{
  "name": "Yogesh Kashyap",
  "role": "Frontend Developer",
  "company": "Razorpay",
  "skills": "React, Node.js, TypeScript",
  "resumeText": "optional extracted resume text...",
  "jobDescription": "optional job description..."
}
```

**Response:**
```json
{
  "success": true,
  "letter": "Dear Hiring Manager..."
}
```

---

## Error Handling

The app handles errors at every layer:

| Stage | Errors Handled |
|---|---|
| Frontend file select | Wrong type, too large, empty file |
| PDF extraction | Scanned PDF, corrupt file, password protected, timeout |
| API request | Network failure, server errors, empty AI response |
| Letter generation | Missing fields, garbled resume text, Gemini quota exceeded |

---

## Known Limitations

- Scanned/image-based PDFs cannot be parsed (no OCR support)
- Free Gemini tier is limited to ~500 requests/day
- Resume text is trimmed to 4000 characters to stay within token limits
- Job description is trimmed to 1500 characters

---

## License

MIT — feel free to use, modify, and distribute.

---

## Acknowledgements

- [Google Gemini API](https://ai.google.dev/) for the AI backbone
- [pdfreader](https://www.npmjs.com/package/pdfreader) for PDF text extraction
- [jsPDF](https://github.com/parallax/jsPDF) for client-side PDF generation
- [DM Sans + DM Serif Display](https://fonts.google.com/) for typography