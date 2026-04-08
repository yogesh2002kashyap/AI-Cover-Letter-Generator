# Prompt.md — Development Prompts Journal
## Every prompt used during the CoverCraft build journey

This file documents the actual prompts sent to AI assistants during the development of this project. It serves as a learning reference and shows how prompt engineering evolved across the build.

---

## SECTION 1 — Project Setup & Planning

### Prompt 1 — Initial Mission Brief
```
Mission 4: The "AI Cover Letter Generator"
Theme: AI Integration, API Keys, and Prompt Engineering.

Goal: Build a tool where a user inputs their skills and a job description,
and your app uses AI (OpenAI/Gemini) to write a perfect cover letter for them.

Choose Your Difficulty Level:
Level 1 - Focus on UI and Simulation
Level 2 - Real AI Connection
Level 3 - The SaaS Level (PDF parsing + personalization)

Don't give me full code. Give me a file with all the instructions as a
roadmap and also give me just the UI because I want to learn everything
and write all the logic myself.
```

**What this produced:** A step-by-step roadmap markdown file + a UI shell with TODO comments, no logic implemented.

**Why it worked:** Explicitly asking for no code forced the AI to give instructions instead of solutions, which is the right approach when learning.

---

### Prompt 2 — Level 2 & 3 Instructions
```
I have done level 1. Now make me an instruction guide for levels 2 and 3.
```

**What this produced:** A detailed 9-step guide for Level 2 (Node.js backend, .env, Gemini API) and 9-step guide for Level 3 (pdf.js, resume extraction, formatted output).

---

## SECTION 2 — Debugging API Errors

### Prompt 3 — First 404 Error
```
Gemini API Error: GoogleGenerativeAIFetchError: [GoogleGenerativeAI Error]:
Error fetching from .../models/gemini-1.5-flash:generateContent:
[404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```
*(Shared full error + server.js + geminiService.js + handleSubmit function)*

**Root cause found:** `gemini-1.5-flash` was deprecated. Fixed to `gemini-2.0-flash`.

**Lesson learned:** Always verify model names against the official docs at https://ai.google.dev/gemini-api/docs/models before using them.

---

### Prompt 4 — Wrong Model Name Question
```
Why not to prefer gemini-3-flash-preview over gemini-2.0-flash
```

**What this revealed:** `gemini-3-flash-preview` does not exist — it was a hallucinated model name from an AI tool or outdated blog post. Never trust model names from secondary sources.

---

### Prompt 5 — 429 Quota Exceeded
```
Gemini API Error: GoogleGenerativeAIFetchError: [429 Too Many Requests]
You exceeded your current quota...
* Quota exceeded for metric: generate_content_free_tier_requests, limit: 0
```

**Root cause:** Daily free tier quota for `gemini-2.0-flash` exhausted from repeated test requests during debugging.

**Fix applied:** Switched to `gemini-2.5-flash` (separate quota bucket) + added 429-specific error handling in server.js.

---

### Prompt 6 — Another 404 After Switching Models
```
Error fetching from .../models/gemini-1.5-flash-8b:generateContent:
[404 Not Found] models/gemini-1.5-flash-8b is not found
```

**Root cause:** `gemini-1.5-flash-8b` was suggested without verification — it doesn't exist on the current API.

**Fix:** Searched official docs and confirmed `gemini-2.5-flash` as the correct current free-tier model.

---

### Prompt 7 — Choosing the Best Model
```
Which is the best model to finalize as the project?
```

**Decision made:** `gemini-2.5-flash`
- 500 requests/day on free tier
- 10 RPM
- Strong writing quality for cover letters
- `gemini-2.0-flash` deprecated as of Feb 2026

---

## SECTION 3 — PDF Implementation

### Prompt 8 — How to Read PDF
```
How to read pdf and extract text from it
```

**First approach suggested:** `pdf-parse` with `multer` on the backend.

---

### Prompt 9 — pdf-parse Import Error
```
PDF parse error: TypeError: pdfParse is not a function
```

**Fix attempted:** Changed import to `require('pdf-parse/lib/pdf-parse.js')`

---

### Prompt 10 — Module Not Defined
```
PDF parse error: ReferenceError: pdf is not defined
```

**Fix:** Moved `require` to the top of the file, outside of any function or route handler.

---

### Prompt 11 — Still Not a Function
```
PDF parse error: TypeError: pdf is not a function
```

**Fix:** Switched library from `pdf-parse` to `pdfreader` which has no export issues in Node.js.

---

### Prompt 12 — ERR_PACKAGE_PATH_NOT_EXPORTED
```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/pdf-parse.js'
is not defined by "exports" in .../pdf-parse/package.json
```

**Final fix:** Abandoned `pdf-parse` entirely. Switched to `pdfreader` with a Promise wrapper around its callback API.

---

### Prompt 13 — Verifying Extraction Without API
```
How to check if pdf text is extracted even without hitting the API
```

**Two methods learned:**
1. `console.log(pdfData.text)` in the browser DevTools console
2. `curl -X POST http://localhost:3000/extract-pdf -F "resume=@path/to/file.pdf"` directly in terminal

---

### Prompt 14 — Understanding Double .json()
```
In the script.js on success fetch const pdfData = await pdfResponse.json()
and inside /extract-pdf endpoint on success res.json({ success: true, text })
— why .json() 2 times?
```

**Concept learned:** HTTP only transports text. `res.json()` serializes the JS object into a string to send it. `response.json()` deserializes the received string back into a JS object. Two different operations at two different ends of the wire.

---

### Prompt 15 — Empty Extracted Text
```
Server running on port 3000
Extracted text: (empty)
```

**Root cause:** The uploaded PDF was a scanned/image-based PDF. `pdfreader` can only extract text from text-based PDFs — not pixels.

**Fix:** Test with a PDF exported from Word or Google Docs. Text-based PDFs work perfectly.

---

## SECTION 4 — Feature Additions

### Prompt 16 — Adding Job Description Field
```
Task: Update an existing AI Cover Letter Generator project with minimal,
efficient changes.

Requirements:
1. Add a new input field for "Job Description" below Resume Upload
2. Ensure the field supports multiline text (textarea)
3. The Job Description field should be optional
4. Update frontend, backend, and AI prompt logic
5. If jobDescription provided → tailor letter to it
6. If not → fallback to resumeText + role
7. Keep logic simple, do not increase token usage excessively

Show exact code changes only (diff-style).
```

**What this produced:** Minimal targeted changes across 4 files — no over-engineering, no new files created.

---

### Prompt 17 — Assignment to Constant Variable
```
Got alert: Assignment to constant variable
```

**Root cause:** `resumeText` was declared with `const` but reassigned inside the `if (pdfFile)` block.

**Fix:** Changed `const resumeText = ""` to `let resumeText = ""`

---

### Prompt 18 — Download PDF + Footer
```
One more final task of this project: make the download pdf button working
and add a stylish footer
```

**What this produced:**
- jsPDF implementation with accent header bar, serif letter font, branded footer line
- HTML footer with logo, tagline, divider, and copyright
- CSS footer styles using existing design tokens

---

### Prompt 19 — Footer Height Adjustment
```
I think the footer needs to be a little bit thinner in height and also
needs to have a little gap with the form box
```

**Fix:** Reduced footer `padding` from `40px/32px` to `24px/20px`, added `margin-top: 48px`.

---

## SECTION 5 — The AI Prompt Inside the App

### The Gemini Prompt (Final Version)

This is the actual prompt sent to Gemini inside `geminiService.js` to generate cover letters:

```
[If resume uploaded]:
Candidate's resume:
---
{resumeText trimmed to 4000 chars}
---

[If job description provided]:
Job description:
---
{jobDescription trimmed to 1500 chars}
---

Write a professional cover letter for:
- Name: {name}
- Role: {role}
- Company: {company}
- Skills: {skills}

Requirements:
1. [If job description]: Tailor the letter specifically to match the job description requirements.
   [If resume only]: Use specific experiences from the resume to personalize the letter.
   [If neither]: Focus on the key skills provided.
2. Keep it under 250 words.
3. Start with a strong hook, not "I am writing to apply for."
4. Use a clean, modern business format.
```

**System instruction (persistent across all requests):**
```
You are an expert career coach and hiring manager. Your goal is to write
persuasive, professional, and concise cover letters that highlight how a
candidate's specific skills solve a company's problems.
```

**Generation config:**
```json
{
  "temperature": 0.7,
  "maxOutputTokens": 800,
  "topP": 0.95
}
```

**Why these values:**
- `temperature: 0.7` — balanced between professional consistency and creative variation
- `maxOutputTokens: 800` — enough for a 250-word letter with formatting
- `topP: 0.95` — keeps output focused without being too rigid

---

## Key Prompt Engineering Lessons Learned

1. **Be specific about format** — "exactly 3 paragraphs" gives better results than "write a letter"
2. **Give the AI a role** — "you are an expert career coach" improves output quality
3. **Use delimiters** — wrapping resume/JD in `---` separators prevents context confusion
4. **Conditional instructions** — different prompt paths based on what the user provided gives smarter output
5. **Constrain length** — "under 250 words" prevents rambling responses
6. **Prohibit clichés explicitly** — "do not use I am writing to apply for" directly improves the opening line
7. **Trim input** — always slice long text before sending: `resumeText.slice(0, 4000)` prevents token limit errors

---

## Total Errors Encountered & Resolved

| # | Error | Resolution |
|---|---|---|
| 1 | 404 gemini-1.5-flash deprecated | Updated to gemini-2.0-flash |
| 2 | gemini-3-flash-preview doesn't exist | Verified on official docs |
| 3 | 429 quota exceeded | Switched to gemini-2.5-flash |
| 4 | 404 gemini-1.5-flash-8b not found | Confirmed gemini-2.5-flash as final model |
| 5 | pdfParse is not a function | Switched import path |
| 6 | pdf is not defined | Moved require to top of file |
| 7 | pdf is not a function | Switched library to pdfreader |
| 8 | ERR_PACKAGE_PATH_NOT_EXPORTED | Abandoned pdf-parse, used pdfreader |
| 9 | Empty extracted text | PDF was scanned — tested with text-based PDF |
| 10 | Assignment to constant variable | Changed const to let for resumeText |