
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Nur POST-Anfragen sind erlaubt."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Der KI-Dienst ist noch nicht konfiguriert."
    });
  }

  const question = req.body?.question;

  if (
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 4000
  ) {
    return res.status(400).json({
      error: "Bitte gib eine Frage mit maximal 4000 Zeichen ein."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions: `Du bist LinguaMentor, ein freundlicher
          Lernbegleiter für universitäre französische Sprachwissenschaft.
          Erkläre fachliche Begriffe verständlich auf Deutsch und verwende
          passende französische Beispiele. Unterstütze eigenständiges Lernen:
          Gib bei Aufgaben zunächst Hinweise statt sofort der vollständigen
          Lösung. Behaupte nicht, dass du Kursunterlagen kennst, die dir
          nicht übermittelt wurden. Weise auf Unsicherheiten hin.`,
          input: question,
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data.error?.type);

      return res.status(502).json({
        error: "Die KI konnte gerade nicht antworten."
      });
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("LinguaMentor request failed.");

    return res.status(500).json({
      error: "Verbindungsfehler beim KI-Mentor."
    });
  }
}
