'use server';

/**
 * @fileOverview Transcribe voice to text using AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranscribeVoiceToTextInputSchema = z.object({
  audioDataUri: z.string(),
});
export type TranscribeVoiceToTextInput = z.infer<typeof TranscribeVoiceToTextInputSchema>;

const TranscribeVoiceToTextOutputSchema = z.object({
  transcription: z.string(),
});
export type TranscribeVoiceToTextOutput = z.infer<typeof TranscribeVoiceToTextOutputSchema>;

const transcribePrompt = ai.definePrompt({
  name: 'transcribeVoiceToTextPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: TranscribeVoiceToTextInputSchema },
  output: { schema: TranscribeVoiceToTextOutputSchema },
  prompt: `Transcribe the following audio accurately to text:
Audio: {{media url=audioDataUri}}`,
});

export async function transcribeVoiceToText(input: TranscribeVoiceToTextInput): Promise<TranscribeVoiceToTextOutput> {
  const { output } = await transcribePrompt(input);
  return output!;
}
