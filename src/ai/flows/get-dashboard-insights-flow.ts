
'use server';

/**
 * @fileOverview An AI flow to generate dynamic dashboard insights based on live weather.
 *
 * - getDashboardInsights - Generates soil health and pest alerts from weather data.
 * - DashboardInsightsInput - The input type for the getDashboardInsights function.
 * - DashboardInsightsOutput - The return type for the getDashboardInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DashboardInsightsInputSchema = z.object({
  location: z.string().describe('The geographical location of the farm.'),
  weather: z.object({
    temperature: z.number().describe('Current temperature in Celsius.'),
    humidity: z.number().describe('Current humidity percentage.'),
    rainfall: z.number().describe('Rainfall in the last hour in mm.'),
    weatherCondition: z.string().describe('A general description of the weather, e.g., "Clouds", "Rain", "Clear".')
  }),
  crops: z.array(z.string()).optional().describe('Optional list of crops the farmer is growing.'),
});
export type DashboardInsightsInput = z.infer<typeof DashboardInsightsInputSchema>;

const SoilHealthSchema = z.object({
  status: z.string().describe('A one-word status for soil health, e.g., "Optimal", "Slightly Dry", "Moisture High".'),
  recommendation: z.string().describe('A concise recommendation for soil management based on the weather.'),
});

const PestAlertSchema = z.object({
  pestName: z.string().describe('The name of the potential pest.'),
  severity: z.enum(['Low', 'Medium', 'High']).describe('The risk level of this pest infestation.'),
  recommendation: z.string().describe('A short, actionable recommendation to prevent or manage the pest.'),
});

const DashboardInsightsOutputSchema = z.object({
  soilHealth: SoilHealthSchema,
  pestAlerts: z.array(PestAlertSchema).describe('A list of 1-2 potential pest alerts based on the weather.'),
});
export type DashboardInsightsOutput = z.infer<typeof DashboardInsightsOutputSchema>;

export async function getDashboardInsights(input: DashboardInsightsInput): Promise<DashboardInsightsOutput> {
  return getDashboardInsightsFlow(input);
}

const getDashboardInsightsPrompt = ai.definePrompt({
  name: 'getDashboardInsightsPrompt',
  input: { schema: DashboardInsightsInputSchema },
  output: { schema: DashboardInsightsOutputSchema },
  prompt: `You are an expert agronomist AI. Your task is to generate dynamic, actionable insights for a farmer's dashboard based on real-time weather data.

CONTEXT:
- Location: {{{location}}}
- Weather: {{weather.temperature}}°C, {{weather.humidity}}% humidity, {{weather.rainfall}}mm rain. Condition: {{{weather.weatherCondition}}}.
{{#if crops}}
- Main Crops: {{#each crops}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

INSTRUCTIONS:
1.  **Analyze Soil Health:** Based on the temperature, rain, and humidity, determine a simple status for the soil (e.g., "Optimal", "Slightly Dry", "High Moisture") and provide a concise, actionable recommendation. For example, if it's hot and dry, recommend checking irrigation. If it's very rainy, recommend checking for waterlogging.
2.  **Generate Pest Alerts:** Based on the weather conditions (e.g., high humidity can lead to fungal diseases, certain temperatures attract specific pests), identify 1 or 2 potential pest or disease threats. For each threat, provide the pest/disease name, a severity level (Low, Medium, or High), and a brief, practical recommendation. If no significant threats are apparent, you can return an empty array for pestAlerts.
3.  Be concise and practical. The farmer needs quick, easy-to-understand insights.
`,
});

const getDashboardInsightsFlow = ai.defineFlow(
  {
    name: 'getDashboardInsightsFlow',
    inputSchema: DashboardInsightsInputSchema,
    outputSchema: DashboardInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await getDashboardInsightsPrompt(input);
    return output!;
  }
);
