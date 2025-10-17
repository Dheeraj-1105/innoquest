'use server';
/**
 * @fileOverview This flow transcribes voice input to text using the Google Speech-to-Text API.
 *
 * - transcribeVoiceToText - A function that handles the voice transcription process.
 * - TranscribeVoiceToTextInput - The input type for the transcribeVoiceToText function.
 * - TranscribeVoiceToTextOutput - The return type for the transcribeVoiceToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeVoiceToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe("A voice audio as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type TranscribeVoiceToTextInput = z.infer<typeof TranscribeVoiceToTextInputSchema>;

const TranscribeVoiceToTextOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio input.'),
});
export type TranscribeVoiceToTextOutput = z.infer<typeof TranscribeVoiceToTextOutputSchema>;

export async function transcribeVoiceToText(input: TranscribeVoiceToTextInput): Promise<TranscribeVoiceToTextOutput> {
  return transcribeVoiceToTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeVoiceToTextPrompt',
  input: {schema: TranscribeVoiceToTextInputSchema},
  output: {schema: TranscribeVoiceToTextOutputSchema},
  prompt: `You are a transcription service. Transcribe the following audio to text:

Audio: {{media url=audioDataUri}}`,
});

const transcribeVoiceToTextFlow = ai.defineFlow(
  {
    name: 'transcribeVoiceToTextFlow',
    inputSchema: TranscribeVoiceToTextInputSchema,
    outputSchema: TranscribeVoiceToTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
