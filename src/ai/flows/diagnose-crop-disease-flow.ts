'use server';

/**
 * @fileOverview A flow to diagnose crop diseases from an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a diseased crop, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  language: z.string().describe('The farmer’s preferred language.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  disease: z.string().describe('The identified disease or pest.'),
  recommendation: z.string().describe('The recommended course of action.'),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

const diagnoseCropDiseasePrompt = ai.definePrompt({
  name: 'diagnoseCropDiseasePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: DiagnoseCropDiseaseInputSchema },
  output: { schema: DiagnoseCropDiseaseOutputSchema },
  prompt: `You are an expert plant pathologist. 
Identify the disease in the image and provide actionable recommendations in {{{language}}}.

Crop Image: {{media url=photoDataUri}}`,
});

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  const { output } = await diagnoseCropDiseasePrompt(input);
  return output!;
}
