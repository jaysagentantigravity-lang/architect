import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { createBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio-utils';

interface UseLiveSessionProps {
  apiKey: string;
  onTranscript: (text: string, isUser: boolean) => void;
  onDocumentUpdate: (content: string) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onError?: (error: any) => void;
}

export function useLiveSession({ apiKey, onTranscript, onDocumentUpdate, onSuggestions, onError }: UseLiveSessionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Define tools for Live API with correct Type enum
  const tools = [
    {
      functionDeclarations: [
        {
          name: 'updateDocument',
          description: 'Update the application design document markdown content.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              content: {
                type: Type.STRING,
                description: 'The full markdown content of the updated design document.',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'suggestNextSteps',
          description: 'Provide a list of suggested answers for the question you asked.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of 3-4 short answer options.',
              },
            },
            required: ['options'],
          },
        },
      ],
    }
  ];

  const connect = useCallback(async () => {
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are a Visionary Solutions Architect. 
          1. Listen to the user's idea.
          2. Update the Document on the right using 'updateDocument' to reflect the idea structure immediately.
          3. Ask EXACTLY ONE clarifying question to refine the requirements.
          4. Call 'suggestNextSteps' with 3-4 options for the user to answer your question.
          
          Start high level (Audience, Platform) then go deep (Tech Stack).
          `,
          tools: tools,
          inputAudioTranscription: {}, 
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log('Live session connected');
            setIsConnected(true);

            // Setup Input Stream
            if (!audioContextRef.current) return;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const blob = createBlob(inputData);
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: blob });
              });
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Tool Calls
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'updateDocument') {
                  const args = fc.args as any;
                  if (args.content) {
                    onDocumentUpdate(args.content);
                  }
                  // Respond OK
                  sessionPromise.then((session: any) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'Canvas updated.' }
                      }]
                    });
                  });
                } else if (fc.name === 'suggestNextSteps') {
                    const args = fc.args as any;
                    if (args.options && onSuggestions) {
                        onSuggestions(args.options);
                    }
                     // Respond OK
                  sessionPromise.then((session: any) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'Suggestions displayed to user.' }
                      }]
                    });
                  });
                }
              }
            }
            
            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
                setIsTalking(true);
                const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(audioData),
                    outputContextRef.current,
                    24000
                );
                
                const source = outputContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputContextRef.current.destination);
                
                // Scheduling
                if (nextStartTimeRef.current < outputContextRef.current.currentTime) {
                    nextStartTimeRef.current = outputContextRef.current.currentTime;
                }
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                
                activeSourcesRef.current.add(source);
                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0) setIsTalking(false);
                };
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(s => s.stop());
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsTalking(false);
            }
          },
          onclose: () => {
            console.log('Live session closed');
            setIsConnected(false);
            setIsTalking(false);
          },
          onerror: (err: any) => {
            console.error('Live session error:', err);
            setIsConnected(false);
            onError?.(err);
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to connect live session", error);
      setIsConnected(false);
      onError?.(error);
    }
  }, [apiKey, onDocumentUpdate, onSuggestions, onError]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
        sessionRef.current.then((session: any) => session.close());
    }
    
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    
    // Clear refs
    inputSourceRef.current = null;
    processorRef.current = null;
    audioContextRef.current = null;
    outputContextRef.current = null;
    sessionRef.current = null;
    setIsConnected(false);
    setIsTalking(false);
  }, []);

  return { connect, disconnect, isConnected, isTalking };
}
