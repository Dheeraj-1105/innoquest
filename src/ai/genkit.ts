'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization and configuration.
 * Using gemini-1.5-flash as the stable default model for the agricultural advisor.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // defaultModel is correctly placed inside the plugin configuration
      defaultModel: 'gemini-1.5-flash',
    }),
  ],
});
