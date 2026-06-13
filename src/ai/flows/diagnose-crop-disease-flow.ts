
'use server';

/**
 * @fileOverview Diagnose crop diseases from an image using Groq vision model.
 */

import { groq, GROQ_VISION_MODEL } from '@/ai/groq-client';

export type DiagnoseCropDiseaseInput = {
  photoDataUri: string;
  language: string;
};

export type DiagnoseCropDiseaseOutput = {
  disease: string;
  recommendation: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil',
};

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  const langName = LANGUAGE_NAMES[input.language] || 'English';

  const completion = await groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are an expert plant pathologist. Analyze this crop image carefully.
Respond ONLY with a valid JSON object in this exact format:
{
  "disease": "Name of the disease, pest, or condition identified (say 'Healthy Crop' if no disease)",
  "recommendation": "Specific treatment and prevention advice in ${langName}"
}`,
          },
          {
            type: 'image_url',
            image_url: { url: input.photoDataUri },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 512,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI vision model');

  const parsed = JSON.parse(content);
  return {
    disease: parsed.disease || 'Unable to identify',
    recommendation: parsed.recommendation || 'Please consult a local agricultural expert.',
  };
}
