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

const FarmerProfileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  cropsGrown: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional(),
}).describe('The profile of the farmer asking the question.');

const ChatAssistantInputSchema = z.object({
  query: z.string().describe('The farmer’s question or query.'),
  language: z.string().describe('The farmer’s preferred language.'),
  farmerProfile: FarmerProfileSchema.optional(),
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

  A farmer has a question. Use the provided context about the farmer, their location, and the crops they grow to give the best possible advice.
  
  Respond to the farmer's query in their preferred language, providing actionable advice.

  {{#if farmerProfile}}
  Farmer's Profile:
  - Name: {{farmerProfile.name}}
  - Location: {{farmerProfile.location}}
  - Crops: {{#each farmerProfile.cropsGrown}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}
  
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
    // In a real app, you would fetch real-time weather and market data here
    // based on the input.farmerProfile.location and input.farmerProfile.cropsGrown.
    // For now, we'll pass static data.

    const contextAwareInput = {
      ...input,
    };
    
    const {output} = await chatAssistantPrompt(contextAwareInput);
    
    // Add mock data if the model didn't provide any.
    if (!output!.weather) {
      output!.weather = "Partly cloudy, 28°C. Humidity at 72%.";
    }
     if (!output!.market) {
      output!.market = "Cotton prices are up by 3% this week.";
    }

    return output!;
  }
);
