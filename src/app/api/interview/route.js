// API route proxy untuk Groq — menjaga API key tetap di server.
// Frontend cukup POST { messages, model?, temperature?, max_tokens? } ke /api/interview

export const runtime = 'edge';

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GROQ_API_KEY belum diset di environment variables server.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, model = 'llama-3.1-8b-instant', temperature = 0.8, max_tokens = 1024 } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Parameter `messages` harus array dan tidak kosong.' }, { status: 400 });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    });

    if (!groqResponse.ok) {
      let errMsg = 'Groq API error';
      try {
        const errBody = await groqResponse.json();
        errMsg = errBody?.error?.message || errMsg;
      } catch (_) {
        // ignore parse error
      }
      return Response.json({ error: errMsg }, { status: groqResponse.status });
    }

    const data = await groqResponse.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return Response.json({ content });
  } catch (e) {
    return Response.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}