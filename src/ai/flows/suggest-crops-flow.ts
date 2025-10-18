'use server';

/**
 * @fileOverview An AI flow to suggest high-demand crops for a given region.
 *
 * - suggestCrops - A function that returns a list of crops and their market prices.
 * - SuggestCropsInput - The input type for the suggestCrops function.
 * - SuggestCropsOutput - The return type for the suggestCrops function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCropsInputSchema = z.object({
  region: z.string().describe('The agricultural region, e.g., a state in India.'),
});
export type SuggestCropsInput = z.infer<typeof SuggestCropsInputSchema>;

const CropSuggestionSchema = z.object({
  cropName: z.string().describe('The name of the suggested crop.'),
  pricePerKg: z.number().describe('The current estimated market price per kilogram for the crop.'),
  reason: z.string().describe('A brief reason why this crop is in high demand or suitable for the region.')
});

const SuggestCropsOutputSchema = z.object({
  crops: z.array(CropSuggestionSchema).describe('A list of suggested crops with their market data.'),
});
export type SuggestCropsOutput = z.infer<typeof SuggestCropsOutputSchema>;

export async function suggestCrops(input: SuggestCropsInput): Promise<SuggestCropsOutput> {
  return suggestCropsFlow(input);
}

const suggestCropsPrompt = ai.definePrompt({
  name: 'suggestCropsPrompt',
  input: {schema: SuggestCropsInputSchema},
  output: {schema: SuggestCropsOutputSchema},
  prompt: `You are an agricultural market analyst.
Based on the current market trends, suggest 5-7 crops that are in high demand in the following region: {{{region}}}.
For each crop, provide its name, a realistic current market price per Kg in INR, and a short reason for the suggestion.
`,
});

const suggestCropsFlow = ai.defineFlow(
  {
    name: 'suggestCropsFlow',
    inputSchema: SuggestCropsInputSchema,
    outputSchema: SuggestCropsOutputSchema,
  },
  async input => {
    const {output} = await suggestCropsPrompt(input);
    return output!;
  }
);
