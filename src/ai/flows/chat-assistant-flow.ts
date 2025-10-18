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

// DATA SOURCE for Government Schemes
const governmentSchemes = [
  {
    name: 'PM-KISAN Scheme',
    keywords: ['pm-kisan', 'income support', '6000'],
    description:
      'A central sector scheme with 100% funding from the Government of India. It provides an income support of Rs. 6000/- per year in three equal installments to all landholding farmer families.',
    eligibility: 'All landholding farmer families in the country.',
    link: 'https://pmkisan.gov.in/registrationformnew.aspx',
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    keywords: ['pmfby', 'crop insurance', 'fasal bima'],
    description:
      'PMFBY is the government-sponsored crop insurance scheme that integrates multiple stakeholders on a single platform.',
    eligibility:
      'All farmers who have been notified by the State Government for the notified crops are eligible.',
    link: 'https://pmfby.gov.in/farmer-self-application-form',
  },
  {
    name: 'Kisan Credit Card (KCC)',
    keywords: ['kcc', 'kisan credit card', 'loan', 'credit'],
    description:
      'The KCC scheme aims at providing adequate and timely credit support from the banking system under a single window with a flexible and simplified procedure to the farmers for their cultivation and other needs.',
    eligibility:
      'Farmers - individual/joint borrowers who are owner cultivators; tenant farmers, oral lessees & sharecroppers; Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers including tenant farmers.',
    link: 'https://www.sbi.co.in/web/agri-rural/agriculture-banking/crop-finance/kisan-credit-card-kcc',
  },
  {
    name: 'National Mission for Sustainable Agriculture (NMSA)',
    keywords: ['nmsa', 'sustainable agriculture', 'soil health'],
    description: 'NMSA has been formulated for enhancing agricultural productivity especially in rainfed areas focusing on integrated farming, water use efficiency, soil health management and synergizing resource conservation.',
    eligibility: 'Varies by specific sub-mission and state-level implementation. Generally open to all farmers.',
    link: 'https://nmsa.gov.in/'
  }
];

// TOOL DEFINITION: This gives the AI the ability to look up scheme info.
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
    return relevantSchemes.length > 0 ? relevantSchemes : [];
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
  advice: z.string().describe('The AI-powered advice for the farmer. If providing a link, ensure it is a valid, clickable URL.'),
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
  tools: [getSchemeInfo],
  prompt: `You are an expert AI agricultural advisor. Your goal is to provide smart, multilingual, and context-aware advice to farmers.

You MUST use the provided real-time context and tools to give the best possible advice. Respond in the farmer's preferred language.

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
2. **SCHEME HELPER:** If the farmer's query is about government schemes, loans, insurance, or subsidies, you MUST use the 'getSchemeInfo' tool to find relevant schemes.
   - Based on the tool's output, explain the scheme's benefits and eligibility in simple terms.
   - At the end of your explanation, you MUST provide the application link from the tool's output. The link must be a valid, full URL. Example: "You can apply here: https://pmkisan.gov.in/".
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
