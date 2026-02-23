/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { Mic, StopCircle, Loader } from 'lucide-react';
import { analyzeSpeech, transcribeAudio } from './services/geminiService';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [symptomAnalysis, setSymptomAnalysis] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        setIsLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            const mimeType = 'audio/webm';
            const transcription = await transcribeAudio(base64Audio, mimeType);
            setTranscribedText(transcription || 'Could not transcribe audio.');
            const analysis = await analyzeSpeech(base64Audio, mimeType);
            setSymptomAnalysis(analysis || 'Could not analyze symptoms.');
          }
          setIsLoading(false);
          audioChunksRef.current = [];
        };
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscribedText('');
      setSymptomAnalysis('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to use this feature.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-gray-800">
      <h1 className="text-5xl font-serif font-bold mb-4 text-center text-indigo-700">CareVoice</h1>
      <p className="text-xl text-gray-700 mb-8 text-center max-w-md">Your voice, understood. Easily report health concerns for clearer telehealth.</p>

      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg flex flex-col items-center">
        <h2 className="text-3xl font-serif font-semibold mb-4 text-indigo-600">How to Use:</h2>
        <ul className="list-disc list-inside text-left text-lg text-gray-700 mb-6 space-y-2">
          <li><span className="font-semibold">Tap the microphone:</span> When you're ready to speak.</li>
          <li><span className="font-semibold">Speak clearly:</span> Describe your health complaint naturally.</li>
          <li><span className="font-semibold">Tap again to stop:</span> When you're finished speaking.</li>
          <li><span className="font-semibold">Review your report:</span> See your words and the AI's symptom analysis.</li>
        </ul>
        <p className="text-lg text-gray-600 mb-6 text-center">Ready to report? Tap the microphone below.</p>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform
            ${isRecording ? 'bg-red-600 shadow-red-400 ring-red-300' : 'bg-indigo-600 shadow-indigo-400 ring-indigo-300'}
            ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
            focus:outline-none focus:ring-8`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="w-14 h-14 text-white animate-spin" />
          ) : isRecording ? (
            <StopCircle className="w-14 h-14 text-white" />
          ) : (
            <Mic className="w-14 h-14 text-white" />
          )}
        </button>

        {isRecording && (
          <p className="mt-4 text-red-600 font-semibold text-lg">Recording... Tap to stop.</p>
        )}

        {isLoading && (
          <p className="mt-4 text-indigo-600 font-semibold text-lg text-center">Analyzing your complaint, please wait...</p>
        )}

        {transcribedText && (
          <div className="mt-8 p-6 bg-gray-100 rounded-xl w-full border border-gray-200">
            <h2 className="text-2xl font-serif font-semibold mb-3 text-indigo-700">Your Spoken Report:</h2>
            <p className="text-gray-800 text-lg italic">{transcribedText}</p>
          </div>
        )}

        {symptomAnalysis && (
          <div className="mt-6 p-6 bg-indigo-50 rounded-xl w-full border border-indigo-200">
            <h2 className="text-2xl font-serif font-semibold mb-3 text-indigo-700">AI Symptom Analysis:</h2>
            <p className="text-gray-900 text-lg whitespace-pre-wrap leading-relaxed">{symptomAnalysis}</p>
          </div>
        )}
      </div>
    </div>
  );
}
