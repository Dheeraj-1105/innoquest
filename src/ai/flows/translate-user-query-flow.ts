
'use server';

/**
 * @fileOverview Translate native language query to English using Groq.
 */

import { groq, GROQ_TEXT_MODEL } from '@/ai/groq-client';

export type TranslateUserQueryInput = {
  query: string;
  sourceLanguage: string;
};

export type TranslateUserQueryOutput = {
  translatedQuery: string;
};

export async function translateUserQuery(input: TranslateUserQueryInput): Promise<TranslateUserQueryOutput> {
  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a translator. Translate the given text to English accurately.
Respond ONLY with a valid JSON object: {"translatedQuery": "the translated text"}`,
      },
      {
        role: 'user',
        content: `Translate this ${input.sourceLanguage} text to English:\n"${input.query}"`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 256,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return {
    translatedQuery: parsed.translatedQuery || input.query,
  };
}
