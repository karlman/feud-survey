import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export interface TabulatedAnswer {
  answerText: string;
  count: number;
  qualityScore: number;
}

export async function tabulateAnswers(
  question: string,
  rawAnswers: { text: string }[]
): Promise<TabulatedAnswer[]> {
  if (!rawAnswers.length) return [];

  const answerList = rawAnswers.map((a, i) => `${i + 1}. ${a.text}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    system: `You are tabulating survey results for a Family Feud game show.
Your job:
1. Group equivalent answers (e.g. "fridge" = "refrigerator" = "the fridge" → "Refrigerator")
2. Filter out junk: gibberish, too vague, offensive, or completely unrelated to the question
3. Count how many raw answers map to each grouped answer
4. Score each answer's quality 0–100: how specific, interesting, and game-worthy it is
5. Return ONLY valid JSON, no other text

Grouping rules:
- Use the most common/recognizable canonical form
- Capitalize properly ("Refrigerator" not "refrigerator")
- Keep answers specific enough to be distinct ("Blue" vs "Light Blue" may be the same)
- Err toward inclusion — only filter obvious spam or completely off-topic answers`,
    messages: [{
      role: 'user',
      content: `Survey question: "${question}"

Raw answers (${rawAnswers.length} total):
${answerList}

Return JSON in this exact format (sorted by count descending):
{
  "tabulatedAnswers": [
    { "answerText": "string", "count": number, "qualityScore": number }
  ]
}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI response did not contain JSON');

  const result = JSON.parse(jsonMatch[0]) as { tabulatedAnswers: TabulatedAnswer[] };
  return result.tabulatedAnswers ?? [];
}
