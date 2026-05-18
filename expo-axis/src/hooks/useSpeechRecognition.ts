import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionProps {
  onResultFinal?: (transcript: string) => void;
}

export function useSpeechRecognition({ onResultFinal }: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      finalTranscriptRef.current = "";
      console.log("[VOICE LISTENING] Started");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current = final;
        setTranscript(final);
        console.log(`[VOICE TRANSCRIPT] Final: ${final}`);
      } else {
        setTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[VOICE ERROR]", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied");
      } else if (event.error === "network") {
        toast.error("Network error during speech recognition");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("[VOICE COMPLETE] Ended");
      
      const finalResult = finalTranscriptRef.current.trim();
      if (finalResult && onResultFinal) {
        onResultFinal(finalResult);
      }
      // Clear transcript after a short delay so user can see it briefly
      setTimeout(() => setTranscript(""), 1000);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResultFinal]);

  const startListening = useCallback(() => {
    if (!supported) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error("Could not start recognition:", e);
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!supported) return;
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.error("Could not stop recognition:", e);
    }
  }, [supported]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    supported
  };
}
