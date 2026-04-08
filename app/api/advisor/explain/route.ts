import { NextRequest, NextResponse } from "next/server";

const FALLBACK_EXPLANATION =
  "Based on your electricity usage and goals, this system size is designed to offset the majority of your consumption while keeping the payback period under 10 years. HEA sizes every system using your real Powercor NEM12 data — not industry averages or guesswork.";

function fallback() {
  return NextResponse.json({ explanation: FALLBACK_EXPLANATION });
}

export async function POST(req: NextRequest) {
  let body: { userInputs?: string; systemOutput?: string };
  try {
    body = await req.json();
  } catch {
    return fallback();
  }

  const { userInputs = "", systemOutput = "" } = body;

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return fallback();

  const prompt = `You are an electrical system designer in Australia.
Explain in simple terms why this system was recommended for this customer.

Customer inputs: ${userInputs}
Recommended system: ${systemOutput}

Keep the explanation under 120 words. Write in plain English. No jargon. No bullet points — just 2–3 clear sentences.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return fallback();

    const data = await res.json();
    const explanation: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (explanation && explanation.trim().length > 10) {
      return NextResponse.json({ explanation: explanation.trim() });
    }
  } catch {
    // Network error or timeout — fall through to fallback
  }

  return fallback();
}
