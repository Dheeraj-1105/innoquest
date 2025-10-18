
import { initializeServerApp } from '@/firebase/server-init';
import { getAiAdvice } from '@/app/actions';
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

    // Only process messages from the user, and that haven't been processed.
    if (data.role === 'user' && !data.processed) {
        const { content, language = 'en' } = data;
        const { farmerId, advisoryId } = event.params;
        
        try {
            // Mark the user's message as 'processed' to prevent loops
            await snapshot.ref.update({ processed: true });

            // Call the AI to get advice
            const queryText = typeof content === 'string' ? content : '🎤 Voice message';
            const aiResponse = await getAiAdvice(queryText, language, farmerId);
            
            // Save the AI's response to a new document in the same subcollection
            const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
            await advisoriesRef.add({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            });

        } catch (error) {
            console.error(`Error processing advisory ${advisoryId} for farmer ${farmerId}:`, error);
        }
    }
});
