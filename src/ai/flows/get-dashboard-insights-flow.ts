
'use server';

/**
 * @fileOverview Generate dashboard insights using Groq.
 */

import { groq, GROQ_TEXT_MODEL } from '@/ai/groq-client';

export type DashboardInsightsInput = {
  location: string;
  weather: {
    temperature: number;
    humidity: number;
    rainfall: number;
    weatherCondition: string;
  };
  crops?: string[];
};

export type DashboardInsightsOutput = {
  soilHealth: {
    status: string;
    recommendation: string;
  };
  pestAlerts: Array<{
    pestName: string;
    severity: 'Low' | 'Medium' | 'High';
    recommendation: string;
  }>;
};

export async function getDashboardInsights(input: DashboardInsightsInput): Promise<DashboardInsightsOutput> {
  const cropsList = input.crops?.length ? input.crops.join(', ') : 'general crops';

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert agronomist providing dashboard insights for Indian farmers.
Respond ONLY with a valid JSON object in this exact format:
{
  "soilHealth": {
    "status": "Good/Fair/Poor",
    "recommendation": "One specific actionable soil recommendation"
  },
  "pestAlerts": [
    {
      "pestName": "Pest or disease name",
      "severity": "Low|Medium|High",
      "recommendation": "One specific prevention or treatment tip"
    }
  ]
}
Include 1-3 pest alerts relevant to the weather and crops.`,
      },
      {
        role: 'user',
        content: `Location: ${input.location}
Weather: ${input.weather.temperature}°C, ${input.weather.humidity}% humidity, ${input.weather.rainfall}mm rainfall, Condition: ${input.weather.weatherCondition}
Crops being grown: ${cropsList}

Generate concise dashboard insights for this farmer.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 512,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return {
    soilHealth: parsed.soilHealth || { status: 'Fair', recommendation: 'Monitor soil moisture regularly.' },
    pestAlerts: parsed.pestAlerts || [],
  };
}
