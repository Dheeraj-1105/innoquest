'use server';

/**
 * @fileOverview An AI flow to suggest high-demand crops for a given region.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestCropsInputSchema = z.object({
  region: z.string().describe('Agricultural region.'),
});
export type SuggestCropsInput = z.infer<typeof SuggestCropsInputSchema>;

const SuggestCropsOutputSchema = z.object({
  crops: z.array(z.object({
    cropName: z.string(),
    pricePerKg: z.number(),
    reason: z.string()
  })),
});
export type SuggestCropsOutput = z.infer<typeof SuggestCropsOutputSchema>;

const suggestCropsPrompt = ai.definePrompt({
  name: 'suggestCropsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: SuggestCropsInputSchema },
  output: { schema: SuggestCropsOutputSchema },
  prompt: `As an agricultural analyst, suggest 5-7 high-demand crops for the region: {{{region}}}. Provide realistic INR prices per Kg and a brief reason.`,
});

export async function suggestCrops(input: SuggestCropsInput): Promise<SuggestCropsOutput> {
  const { output } = await suggestCropsPrompt(input);
  return output!;
}
