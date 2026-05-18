import { useState, useEffect } from "react";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

interface Props {
  onSend: (text: string) => void;
}

export function CommandBar({ onSend }: Props) {
  const [value, setValue] = useState("");

  const handleResultFinal = (transcript: string) => {
    onSend(transcript);
    setValue("");
  };

  const { isListening, transcript, toggleListening } = useSpeechRecognition({ onResultFinal: handleResultFinal });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || isListening) return;
    onSend(v);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="panel fade-in flex items-stretch gap-0">
      <div className="flex items-center px-3 text-foreground" style={{ borderRight: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={toggleListening}
          className={`press-scale flex items-center justify-center p-1.5 rounded-full mr-2 transition-colors ${
            isListening ? "voice-pulse" : "hover:bg-white/5"
          }`}
          style={{ 
            color: isListening ? "var(--alert-foreground)" : "var(--muted-foreground)",
            backgroundColor: isListening ? "var(--alert)" : "transparent" 
          }}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
        <span className="text-sm tracking-widest">{">"}</span>
        <span className="blink ml-1 inline-block h-3 w-1.5" style={{ background: "var(--foreground)" }} aria-hidden />
      </div>
      <input
        value={isListening ? transcript : value}
        onChange={(e) => {
          if (!isListening) setValue(e.target.value);
        }}
        placeholder={isListening ? "Listening..." : 'Enter command... (e.g. "Move forward 3 meters and turn left")'}
        spellCheck={false}
        autoComplete="off"
        readOnly={isListening}
        className="flex-1 bg-transparent px-3 py-3 text-sm tracking-wider outline-none text-foreground placeholder:text-muted-foreground"
        aria-label="Natural language command"
      />
      <button
        type="submit"
        disabled={isListening || !value.trim()}
        className="press-scale px-5 text-xs tracking-[0.35em] uppercase text-background disabled:opacity-50"
        style={{ background: "var(--foreground)" }}
      >
        Transmit
      </button>
    </form>
  );
}
