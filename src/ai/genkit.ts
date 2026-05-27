import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization and configuration.
 * This file initializes the Genkit instance with the Google AI plugin.
 * It does NOT use 'use server' because it exports the 'ai' instance object.
 */

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
