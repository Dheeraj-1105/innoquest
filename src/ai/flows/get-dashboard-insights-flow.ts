'use server';

/**
 * @fileOverview An AI flow to generate dynamic dashboard insights based on live weather.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DashboardInsightsInputSchema = z.object({
  location: z.string().describe('Farm location.'),
  weather: z.object({
    temperature: z.number(),
    humidity: z.number(),
    rainfall: z.number(),
    weatherCondition: z.string()
  }),
  crops: z.array(z.string()).optional(),
});
export type DashboardInsightsInput = z.infer<typeof DashboardInsightsInputSchema>;

const DashboardInsightsOutputSchema = z.object({
  soilHealth: z.object({
    status: z.string(),
    recommendation: z.string(),
  }),
  pestAlerts: z.array(z.object({
    pestName: z.string(),
    severity: z.enum(['Low', 'Medium', 'High']),
    recommendation: z.string(),
  })),
});
export type DashboardInsightsOutput = z.infer<typeof DashboardInsightsOutputSchema>;

const getDashboardInsightsPrompt = ai.definePrompt({
  name: 'getDashboardInsightsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: DashboardInsightsInputSchema },
  output: { schema: DashboardInsightsOutputSchema },
  prompt: `You are an expert agronomist. Generate actionable soil and pest insights for this context:
Location: {{{location}}}
Weather: {{weather.temperature}}°C, {{weather.humidity}}% humidity. Condition: {{{weather.weatherCondition}}}.
Crops: {{#each crops}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

Provide concise, practical advice for a farmer's dashboard.`,
});

export async function getDashboardInsights(input: DashboardInsightsInput): Promise<DashboardInsightsOutput> {
  const { output } = await getDashboardInsightsPrompt(input);
  return output!;
}
