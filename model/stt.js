const fs = require('fs');
const path = require('path');
const wav = require('node-wav');
const speech = require('@google-cloud/speech');


// Create a client for Google Cloud Speech-to-Text
const client = new speech.SpeechClient();

// Read the audio file
const audioFilePath = path.join(__dirname, '../untitled.wav');
const audio_chunk = fs.readFileSync(audioFilePath);

function getAudioProperties(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = wav.decode(buffer);
    return result.sampleRate; // Extract sample rate
}

async function generate_text(audio_chunk) {
    console.log("Processing audio...");

    // Convert audio file to base64
    const audioBytes = audio_chunk.toString('base64');

    try {
     
       

        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'LINEAR16', // Ensure this matches your audio file's format
                sampleRateHertz: 16000, // Use the dynamically determined sample rate
                languageCode: 'en-US',
            },
        };

        // Detects speech in the audio file
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        console.log(`Transcription: ${transcription}`);
    } catch (error) {
        console.error('Error during transcription:', error);
    }
}

generate_text(audio_chunk);
