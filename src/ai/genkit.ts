'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The default model was previously configured incorrectly at the top level.
      // Placing it here ensures it's correctly used by the Google AI plugin.
      defaultModel: 'gemini-1.5-flash-latest',
    }),
  ],
  // This top-level model property is not the correct way to set the default
  // for the plugin and has been removed.
});
