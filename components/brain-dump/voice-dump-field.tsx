"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * A brain-dump text field you can talk into. Uses the browser's built-in
 * Web Speech API (SpeechRecognition) — transcription happens in the browser,
 * nothing is sent anywhere. Works in Safari on iOS and Chrome. Falls back to
 * a plain textarea where speech isn't supported. The finalized transcript
 * lives in a `content`-named textarea so the existing save flow is unchanged;
 * you can freely mix talking and typing.
 */
export function VoiceDumpField() {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  listeningRef.current = listening;

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += transcript;
        else interimChunk += transcript;
      }
      if (finalChunk) {
        setText((prev) => {
          const sep = prev && !/\s$/.test(prev) ? " " : "";
          return prev + sep + finalChunk.trim();
        });
      }
      setInterim(interimChunk);
    };

    recognition.onerror = (event: any) => {
      // Permission problems are terminal; transient ones (no-speech, aborted)
      // just let onend restart the session.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was blocked. Allow the mic for this site and try again.");
        listeningRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      setInterim("");
      // Safari ends recognition after a pause — restart while still listening.
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      }
    };

    recognitionRef.current = recognition;
    return () => {
      listeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggle() {
    setError(null);
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      setListening(false);
      listeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      setInterim("");
    } else {
      setListening(true);
      listeningRef.current = true;
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          name="content"
          value={interim ? `${text}${text && !/\s$/.test(text) ? " " : ""}${interim}` : text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[180px] pr-14"
          placeholder="Let it all out — worries, ideas, to-dos, feelings. Type, or tap the mic and talk."
        />
        {supported ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={listening ? "Stop recording" : "Start voice input"}
            aria-pressed={listening}
            className={cn(
              "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
              listening
                ? "border-red-500 bg-red-500/20 text-red-400"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {listening ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/30" />
            ) : null}
          </button>
        ) : null}
      </div>

      {listening ? (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening… talk freely, then tap the mic to stop. What you say appears above.
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {!supported ? (
        <p className="text-xs text-muted-foreground">
          Voice input isn’t available in this browser — you can still type. (Tip: on iPhone, open
          the app in Safari for voice.)
        </p>
      ) : null}
    </div>
  );
}
