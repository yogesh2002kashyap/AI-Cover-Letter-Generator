const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing. Check your .env file.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCoverLetter({  name, role, company, skills, resumeText }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction:
      "You are an expert career coach and hiring manager. Your goal is to write persuasive, professional, and concise cover letters that highlight how a candidate's specific skills solve a company's problems.",
  });

  const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 800,
    topP: 0.95,
  };


  // Build prompt differently based on whether resume was provided
  const resumeSection = resumeText
    ? `Here is the candidate's resume:\n---\n${resumeText.slice(0, 6000)}\n---\n`
    : '';
    
  const prompt = `
    ${resumeSection}
    Write a professional cover letter for:
    - Candidate Name: ${name}
    - Targeted Role: ${role}
    - Company: ${company}
    - Key Skills: ${skills}

    Requirements:
    1. ${resumeText ? 'Use specific experiences from the resume to personalize the letter.' : 'Focus on the skills provided.'}
    2. Keep it under 250 words.
    3. Start with a strong hook, not "I am writing to apply for."
    4. Use a clean, modern business format.
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  });

  const text = result.response.text();

  if (!text || text.trim() === "") {
    throw new Error("Gemini returned an empty response. Try rephrasing your input.");
  }

  return text;
}

module.exports = { generateCoverLetter };