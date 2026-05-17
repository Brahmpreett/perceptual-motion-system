import { useState } from "react";

interface Props {
  onSend: (text: string) => void;
}

export function CommandBar({ onSend }: Props) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSend(v);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="panel fade-in flex items-stretch gap-0">
      <div className="flex items-center px-3 text-foreground" style={{ borderRight: "1px solid var(--border)" }}>
        <span className="text-sm tracking-widest">{">"}</span>
        <span className="blink ml-1 inline-block h-3 w-1.5" style={{ background: "var(--foreground)" }} aria-hidden />
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Enter command... (e.g. "Move forward 3 meters and turn left")'
        spellCheck={false}
        autoComplete="off"
        className="flex-1 bg-transparent px-3 py-3 text-sm tracking-wider outline-none text-foreground placeholder:text-muted-foreground"
        aria-label="Natural language command"
      />
      <button
        type="submit"
        className="press-scale px-5 text-xs tracking-[0.35em] uppercase text-background"
        style={{ background: "var(--foreground)" }}
      >
        Transmit
      </button>
    </form>
  );
}
