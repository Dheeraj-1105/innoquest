
'use server';

import { initializeServerApp } from '@/firebase/server-init';
import { getAiAdvice, getAiDiagnosisForCrop, getAiAdviceFromVoice } from '@/app/actions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// This is a placeholder for the actual cloud function deployment.
// The local 'firebase-functions' package allows for type-checking and local emulation.
// In a real Firebase project, this would be deployed as a Cloud Function.

export const processNewAdvisory = onDocumentCreated("/farmers/{farmerId}/advisories/{advisoryId}", async (event) => {
    const { firestore } = await initializeServerApp();
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const data = snapshot.data();
    const { advisoryId } = event.params;

    // Only process messages from the user, and only if they haven't been processed yet.
    if (data.role === 'user' && !data.processed) {
        const { content, language = 'en', farmerId } = data;
        
        try {
            let responseContent;

            if (typeof content === 'string') {
               responseContent = await getAiAdvice(content, language, farmerId);
            } else if (content && typeof content === 'object') {
              if ('image' in content) {
                responseContent = await getAiDiagnosisForCrop(content.image, language);
              } else if ('audio' in content) {
                responseContent = await getAiAdviceFromVoice(content.audio, language, farmerId);
              }
            }
            
            if (responseContent) {
                // Save the AI's response to a new document in the same subcollection
                const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
                await advisoriesRef.add({
                    role: 'assistant',
                    content: responseContent,
                    timestamp: new Date(),
                    farmerId,
                });
            }

        } catch (error) {
            console.error(`Error processing advisory ${advisoryId} for farmer ${farmerId}:`, error);
             const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
              await advisoriesRef.add({
                    role: 'assistant',
                    content: { advice: 'Sorry, I encountered an error. Please try again.' },
                    timestamp: new Date(),
                    farmerId,
                });
        } finally {
            // Mark the user's message as processed to prevent re-triggering.
            await snapshot.ref.update({ processed: true });
        }
    }
});
