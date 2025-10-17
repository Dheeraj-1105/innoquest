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
  weather: z.string().optional().describe('A summary of the weather information used for the advice.'),
  market: z.string().optional().describe('A summary of the market information used for the advice.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  return chatAssistantFlow(input);
}

const chatAssistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: ChatAssistantOutputSchema},
  prompt: `You are an expert AI agricultural advisor. Your goal is to provide smart, multilingual, and context-aware advice to farmers.

You MUST use the provided real-time context to give the best possible advice. Respond in the farmer's preferred language.

CONTEXT:
{{#if farmerProfile}}
- Farmer Profile:
  - Name: {{farmerProfile.name}}
  - Location: {{farmerProfile.location}}
  - Main Crops: {{#each farmerProfile.cropsGrown}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
  - Preferred Language: {{{language}}}
{{/if}}

{{#if weather}}
- Current Weather in {{farmerProfile.location}}:
  - Temperature: {{weather.temperature}}°C
  - Humidity: {{weather.humidity}}%
  - Rainfall: {{weather.rainfall}}mm
{{/if}}

{{#if market}}
- Current Market Prices (per Kg):
  {{#each market}}
  - {{this.cropName}}: ₹{{this.pricePerKg}}
  {{/each}}
{{/if}}

FARMER'S QUERY:
"{{{query}}}"

INSTRUCTIONS:
1. Analyze the farmer's query and all the context provided.
2. Formulate a clear, actionable, and personalized advisory.
3. If the query is about crop suitability, use weather and market data to make a recommendation.
4. If the query is about selling crops, use the market data to advise.
5. If the query is about pests or diseases, consider the weather conditions.
6. Generate a summary of the weather and market data you used in the 'weather' and 'market' output fields.
7. The final 'advice' field MUST be in the farmer's preferred language: {{{language}}}.

Example for a farmer growing rice in Telangana with high humidity and good prices: "The weather is cloudy and humidity is high. Current rice market price is ₹52/kg. Advise if this crop is ideal for this week and suggest preventive pest measures."
Your response should be structured and helpful.
`,
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async input => {
    const {output} = await chatAssistantPrompt(input);
    
    // The model should generate the summaries, but provide a fallback just in case.
    if (input.weather && !output!.weather) {
      output!.weather = `${input.weather.temperature}°C, ${input.weather.humidity}% humidity.`;
    }
    if (input.market && !output!.market) {
      const crop = input.market[0];
      if (crop) {
        output!.market = `${crop.cropName} at ₹${crop.pricePerKg}/kg.`;
      }
    }

    return output!;
  }
);
