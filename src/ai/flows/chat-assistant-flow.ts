'use server';

/**
 * @fileOverview AI-powered chat assistant for farmers.
 *
 * - chatAssistantFlow - A flow that handles farmer questions and provides AI-powered advice in their local language.
 * - ChatAssistantInput - The input type for the chatAssistantFlow function.
 * - ChatAssistantOutput - The return type for the chatAssistantFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAssistantInputSchema = z.object({
  query: z.string().describe('The farmer’s question or query.'),
  language: z.string().describe('The farmer’s preferred language.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  advice: z.string().describe('The AI-powered advice for the farmer.'),
  language: z.string().describe('The language in which the advice is provided.'),
  weather: z.string().optional().describe('Weather information for the farmer’s location.'),
  market: z.string().optional().describe('Market information for the farmer’s crops.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  return chatAssistantFlow(input);
}

const chatAssistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: ChatAssistantOutputSchema},
  prompt: `You are an AI-powered agricultural advisor assisting farmers with their crops.

  Respond to the farmer's query in their preferred language, providing actionable advice.

  Farmer's Query: {{{query}}}
  Preferred Language: {{{language}}}

  Include relevant weather and market information if available.

  Format your response as a JSON object:
  {
    "advice": "Your advice here",
    "language": "The language of the advice",
    "weather": "Optional weather information",
    "market": "Optional market information"
  }`,
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async input => {
    const {output} = await chatAssistantPrompt(input);
    return output!;
  }
);
