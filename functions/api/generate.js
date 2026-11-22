
export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "AI API key is not configured." },
        { status: 500 }
      );
    }

    const data = await context.request.json();

    const {
      businessName,
      policies,
      customerQuestion,
      tone
    } = data;

    if (!businessName || !policies || !customerQuestion) {
      return Response.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const prompt = `
You are TaskPilot AI, a professional customer support assistant.

Business name: ${businessName}

Business policies and FAQs:
${policies}

Customer question:
${customerQuestion}

Reply tone: ${tone || "Friendly and helpful"}

Instructions:
1. Write a helpful and professional customer reply.
2. Follow the business policies provided.
3. Never invent refunds, discounts, delivery dates or promises.
4. If information is missing, politely say the business team can confirm it.
5. Return only the customer-facing reply.
`;

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      }
    );

    const result = await aiResponse.json();

    if (!aiResponse.ok) {
      return Response.json(
        { error: "AI service error. Please try again later." },
        { status: 502 }
      );
    }

    const reply =
      result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      return Response.json(
        { error: "AI could not generate a reply." },
        { status: 502 }
      );
    }

    return Response.json({ reply });

  } catch (error) {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
