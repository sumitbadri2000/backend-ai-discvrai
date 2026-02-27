import express from "express";
import { products } from "../data/products.js";
import { openai } from "../utils/openaiClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const context = products
      .map(
        (p) =>
          `ID:${p.id}, Name:${p.name}, Category:${p.category}, Price:${
            p.price
          }, Tags:${p.tags.join(",")}`
      )
      .join("\n");

    const prompt = `
You are a product recommendation assistant.

User query: "${query}"

Products:
${context}

Return ONLY valid JSON:

{
  "productIds": [numbers],
  "summary": "short helpful sentence"
}
`;

    const completion = await openai.chat.completions.create({
      model: "openrouter/auto",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;

    let parsed;

    try {
      // ✅ extract JSON from model response
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("❌ JSON parse error:", text);

      return res.status(502).json({
        message: "AI returned invalid format",
      });
    }

    const matchedProducts = products.filter((p) =>
      parsed.productIds.includes(p.id)
    );

    res.json({
      products: matchedProducts,
      summary: parsed.summary,
    });
  } catch (err) {
    console.error(err);
    res.status(503).json({
      message: "AI service temporarily unavailable",
    });
  }
});

export default router;
