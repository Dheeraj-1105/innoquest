'use server';

/**
 * @fileOverview AI-powered chat assistant for farmers.
 *
 * - chatAssistant - A function that handles farmer questions and provides AI-powered advice.
 * - ChatAssistantInput - The input type for the chatAssistant function.
 * - ChatAssistantOutput - The return type for the chatAssistant function.
 */

import {ai} from '@/ai/genkit';
import { governmentSchemes } from '@/lib/schemes';
import {z} from 'genkit';

// TOOL DEFINITION: Look up government agricultural schemes.
const getSchemeInfo = ai.defineTool(
  {
    name: 'getSchemeInfo',
    description: 'Get information about a specific government agricultural scheme.',
    inputSchema: z.object({
      schemeKeywords: z.array(z.string()).describe('Keywords related to the scheme name, like "kcc", "loan", or "insurance".'),
    }),
    outputSchema: z.array(z.object({
      name: z.string(),
      description: z.string(),
      eligibility: z.string(),
      link: z.string(),
    })),
  },
  async (input) => {
    const searchKeywords = input.schemeKeywords.map(k => k.toLowerCase());
    const relevantSchemes = governmentSchemes.filter(scheme => 
      searchKeywords.some(searchKeyword => 
        scheme.keywords.some(schemeKeyword => schemeKeyword.includes(searchKeyword))
      )
    );
    return relevantSchemes.length > 0 ? relevantSchemes.map(s => ({...s, name: s.title })) : [];
  }
);

const FarmerProfileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  cropsGrown: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional(),
}).describe('The profile of the farmer asking the question.');

const WeatherDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    rainfall: z.number(),
}).describe('Current weather data for the farmer\'s location.');

const MarketDataSchema = z.object({
    cropName: z.string(),
    pricePerKg: z.number(),
}).describe('Current market price for a specific crop.');

const ChatAssistantInputSchema = z.object({
  query: z.string().describe('The farmer’s question or query.'),
  language: z.string().describe('The farmer’s preferred language.'),
  farmerProfile: FarmerProfileSchema.optional(),
  weather: WeatherDataSchema.optional(),
  market: z.array(MarketDataSchema).optional(),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  advice: z.string().describe('The AI-powered advice for the farmer.'),
  language: z.string().describe('The language in which the advice is provided.'),
  weather: z.string().optional().describe('A summary of weather used.'),
  market: z.string().optional().describe('A summary of market used.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

const chatAssistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: ChatAssistantOutputSchema},
  tools: [getSchemeInfo],
  prompt: `You are an expert AI agricultural advisor. Use the provided context to advise the farmer in their language: {{{language}}}.

CONTEXT:
{{#if farmerProfile}}
- Farmer: {{farmerProfile.name}} in {{farmerProfile.location}}. Crops: {{#each farmerProfile.cropsGrown}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if weather}}
- Weather: {{weather.temperature}}°C, {{weather.humidity}}% humidity, {{weather.rainfall}}mm rain.
{{/if}}

{{#if market}}
- Market:
  {{#each market}}
  - {{this.cropName}}: ₹{{this.pricePerKg}}/kg
  {{/each}}
{{/if}}

FARMER'S QUERY:
"{{{query}}}"

INSTRUCTIONS:
1. Use 'getSchemeInfo' if the query is about government support, loans, or schemes.
2. Provide specific, actionable advice based on weather and market data if available.
3. Your final 'advice' must be in {{{language}}}.
`,
});

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  const {output} = await chatAssistantPrompt(input);
  return output!;
}
