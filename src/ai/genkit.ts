import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization and configuration.
 * Using gemini-1.5-flash as the stable default model for the agricultural advisor.
 * This file does NOT use 'use server' because it exports an object (the ai instance).
 */

export const ai = genkit({
  plugins: [
    googleAI({
      defaultModel: 'gemini-1.5-flash',
    }),
  ],
});
