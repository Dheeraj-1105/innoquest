
'use server';

/**
 * @fileOverview Suggest high-demand crops for a region using Groq.
 */

import { groq, GROQ_TEXT_MODEL } from '@/ai/groq-client';

export type SuggestCropsInput = {
  region: string;
};

export type SuggestCropsOutput = {
  crops: Array<{
    cropName: string;
    pricePerKg: number;
    reason: string;
  }>;
};

export async function suggestCrops(input: SuggestCropsInput): Promise<SuggestCropsOutput> {
  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an agricultural market analyst for India.
Respond ONLY with a valid JSON object in this exact format:
{
  "crops": [
    {
      "cropName": "Crop name",
      "pricePerKg": 45.5,
      "reason": "One sentence reason why this crop is profitable"
    }
  ]
}
Suggest exactly 6 high-demand crops with realistic INR market prices per kg.`,
      },
      {
        role: 'user',
        content: `Suggest the best 6 high-demand, profitable crops for the region: ${input.region}. Use current realistic Indian market prices.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 512,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return {
    crops: parsed.crops || [],
  };
}
