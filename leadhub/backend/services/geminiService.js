const { decrypt } = require('../config/crypto');

const MODEL = 'gemini-2.0-flash';

async function scoreLead({ geminiApiKey, lead }) {
  const apiKey = decrypt(geminiApiKey) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Smart heuristic fallback when Gemini API key is not configured yet
    let score = 50;
    if (lead.queryType === 'BL') score += 25; // Buy leads carry high intent
    if (lead.senderMobile) score += 10;
    if (lead.senderEmail) score += 5;
    if (lead.queryMessage && lead.queryMessage.length > 20) score += 10;
    score = Math.min(95, score);

    const summary = `Lead Analysis: ${lead.queryType === 'BL' ? 'Verified Buy Lead' : 'Direct Enquiry'} for "${lead.productName || 'services'}". Buyer located in ${lead.senderCity || lead.senderState || 'India'}. (Built-in smart lead scoring).`;
    return { score, summary };
  }

  const prompt = `You are a B2B sales assistant analyzing an IndiaMART lead enquiry.
Product enquired: ${lead.productName || 'N/A'}
Buyer message: "${lead.queryMessage || 'N/A'}"
Buyer location: ${lead.senderCity || ''} ${lead.senderState || ''}
Lead type: ${lead.queryType === 'BL' ? 'Buy Lead (buyer actively sourcing)' : 'Direct Enquiry'}

Respond ONLY with strict JSON, no markdown, no code fences, in this exact shape:
{"score": <integer 0-100 lead quality score>, "summary": "<one or two sentence summary of what the buyer needs, in plain business English, for a sales rep to quickly act on>"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${errText}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(clean);
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      summary: parsed.summary || '',
    };
  } catch (err) {
    return { score: 50, summary: 'Could not parse AI response automatically.' };
  }
}

module.exports = { scoreLead };
