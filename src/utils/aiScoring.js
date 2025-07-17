import fetch from "node-fetch";

export async function getAISimilarityScore(userAnswer, correctAnswer) {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = "https://api.openai.com/v1/chat/completions";

  const prompt = `
You are an IELTS writing examiner. Compare the following student's answer to the correct answer. Give a score from 0 to 100 for how correct the student's answer is, and explain briefly. Only output in this format:\nScore: <number>\nExplanation: <text>\n\nCorrect Answer: "${correctAnswer}"
Student Answer: "${userAnswer}"
`;

  const body = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are an IELTS writing examiner." },
      { role: "user", content: prompt }
    ],
    max_tokens: 150,
    temperature: 0
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log("OpenAI API response:", data);
    const text = data.choices?.[0]?.message?.content || "";
    const match = text.match(/Score\s*:?\s*(\d+)/i);
    const score = match ? parseInt(match[1], 10) : null;
    return {
      score,
      explanation: text
    };
  } catch (err) {
    console.error("OpenAI API error:", err);
    return { score: null, explanation: "API error" };
  }
} 