import fetch from "node-fetch";

export async function getAISimilarityScore(userAnswer, correctAnswer) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const prompt = `
You are an IELTS writing examiner. Compare the following student's answer to the correct answer. Give a score from 0 to 100 for how correct the student's answer is, and explain briefly.

Correct Answer: "${correctAnswer}"
Student Answer: "${userAnswer}"

Score (0-100):
Explanation:
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log("Gemini API response:", data);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = text.match(/Score\s*\(?0-100\)?:?\s*(\d+)/i);
  const score = match ? parseInt(match[1], 10) : null;
  return {
    score,
    explanation: text
  };
}