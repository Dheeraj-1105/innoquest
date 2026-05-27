'use server';

/**
 * @fileOverview AI-powered chat assistant for farmers.
 * Provides personalized agricultural advice based on profile, weather, and market data.
 */

import { ai } from '@/ai/genkit';
import { governmentSchemes } from '@/lib/schemes';
import { z } from 'genkit';

const getSchemeInfo = ai.defineTool(
  {
    name: 'getSchemeInfo',
    description: 'Get information about a specific government agricultural scheme.',
    inputSchema: z.object({
      schemeKeywords: z.array(z.string()).describe('Keywords related to the scheme name.'),
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
    return relevantSchemes.map(s => ({
      name: s.title,
      description: s.description,
      eligibility: s.eligibility,
      link: s.link
    }));
  }
);

const FarmerProfileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  cropsGrown: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional(),
});

const WeatherDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    rainfall: z.number(),
});

const MarketDataSchema = z.object({
    cropName: z.string(),
    pricePerKg: z.number(),
});

const ChatAssistantInputSchema = z.object({
  query: z.string(),
  language: z.string(),
  farmerProfile: FarmerProfileSchema.optional(),
  weather: WeatherDataSchema.optional(),
  market: z.array(MarketDataSchema).optional(),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  advice: z.string(),
  language: z.string(),
  weatherSummary: z.string().optional(),
  marketSummary: z.string().optional(),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

const chatAssistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ChatAssistantInputSchema },
  output: { schema: ChatAssistantOutputSchema },
  tools: [getSchemeInfo],
  prompt: `You are an expert AI agricultural advisor. 
Provide actionable advice in the requested language: {{{language}}}.

CONTEXT:
{{#if farmerProfile}}
- Farmer: {{farmerProfile.name}} in {{farmerProfile.location}}. Crops: {{#each farmerProfile.cropsGrown}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if weather}}
- Current Weather: {{weather.temperature}}°C, {{weather.humidity}}% humidity, {{weather.rainfall}}mm rain.
{{/if}}

{{#if market}}
- Local Market Prices:
  {{#each market}}
  - {{this.cropName}}: ₹{{this.pricePerKg}}/kg
  {{/each}}
{{/if}}

FARMER'S QUERY:
"{{{query}}}"

INSTRUCTIONS:
1. Use 'getSchemeInfo' if the query is about government support or loans.
2. Provide specific advice for their crops and current weather.
3. Keep the response helpful and empathetic.
`,
});

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  const { output } = await chatAssistantPrompt(input);
  return output!;
}
