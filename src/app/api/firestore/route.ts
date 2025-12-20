
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
    const { farmerId, advisoryId } = event.params;

    // Only process messages from the user, and only if they haven't been processed yet.
    if (data.role === 'user' && data.processed === false) {
        const { content, language = 'en' } = data;
        
        try {
            let responseContent;

            // Handle different types of user content
            if (typeof content === 'string') {
               const response = await getAiAdvice(content, language, farmerId);
               responseContent = response;
            } else if (content && typeof content === 'object') {
              if ('image' in content && typeof content.image === 'string') {
                const response = await getAiDiagnosisForCrop(content.image, language);
                responseContent = response;
              } else if ('audio' in content && typeof content.audio === 'string') {
                const response = await getAiAdviceFromVoice(content.audio, language, farmerId);
                responseContent = response;
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
                    processed: true, // AI messages are always "processed"
                });
            } else {
                throw new Error("Could not generate a valid AI response for the given content.");
            }

        } catch (error: any) {
            console.error(`Error processing advisory ${advisoryId} for farmer ${farmerId}:`, error);
             // Save an error message back to the user
             const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
             await advisoriesRef.add({
                    role: 'assistant',
                    content: { advice: `Sorry, I encountered an error processing your request: ${error.message}` },
                    timestamp: new Date(),
                    farmerId,
                    processed: true,
                });
        } finally {
            // Mark the user's message as processed to prevent re-triggering.
            await snapshot.ref.update({ processed: true });
        }
    }
});
