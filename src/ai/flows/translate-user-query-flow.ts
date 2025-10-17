'use server';

/**
 * @fileOverview A flow to translate user queries to English for better processing.
 *
 * - translateUserQuery - A function that translates the user's query to English.
 * - TranslateUserQueryInput - The input type for the translateUserQuery function.
 * - TranslateUserQueryOutput - The return type for the translateUserQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateUserQueryInputSchema = z.object({
  query: z.string().describe('The user query in their native language.'),
  sourceLanguage: z.string().describe('The ISO 639-1 code of the source language.'),
});
export type TranslateUserQueryInput = z.infer<typeof TranslateUserQueryInputSchema>;

const TranslateUserQueryOutputSchema = z.object({
  translatedQuery: z.string().describe('The translated user query in English.'),
});
export type TranslateUserQueryOutput = z.infer<typeof TranslateUserQueryOutputSchema>;

export async function translateUserQuery(input: TranslateUserQueryInput): Promise<TranslateUserQueryOutput> {
  return translateUserQueryFlow(input);
}

const translateUserQueryPrompt = ai.definePrompt({
  name: 'translateUserQueryPrompt',
  input: {schema: TranslateUserQueryInputSchema},
  output: {schema: TranslateUserQueryOutputSchema},
  prompt: `Translate the following user query from {{sourceLanguage}} to English.\n\nUser Query: {{{query}}}`,
});

const translateUserQueryFlow = ai.defineFlow(
  {
    name: 'translateUserQueryFlow',
    inputSchema: TranslateUserQueryInputSchema,
    outputSchema: TranslateUserQueryOutputSchema,
  },
  async input => {
    const {output} = await translateUserQueryPrompt(input);
    return output!;
  }
);
