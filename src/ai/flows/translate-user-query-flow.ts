'use server';

/**
 * @fileOverview Translate native language query to English.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateUserQueryInputSchema = z.object({
  query: z.string(),
  sourceLanguage: z.string(),
});
export type TranslateUserQueryInput = z.infer<typeof TranslateUserQueryInputSchema>;

const TranslateUserQueryOutputSchema = z.object({
  translatedQuery: z.string(),
});
export type TranslateUserQueryOutput = z.infer<typeof TranslateUserQueryOutputSchema>;

const translatePrompt = ai.definePrompt({
  name: 'translateUserQueryPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: TranslateUserQueryInputSchema },
  output: { schema: TranslateUserQueryOutputSchema },
  prompt: `Translate from {{sourceLanguage}} to English:
"{{{query}}}"`,
});

export async function translateUserQuery(input: TranslateUserQueryInput): Promise<TranslateUserQueryOutput> {
  const { output } = await translatePrompt(input);
  return output!;
}
