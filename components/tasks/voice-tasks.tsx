"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Wand2, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addManyTasks } from "@/lib/actions";

type Draft = { id: string; title: string; category: "work" | "personal" };

/**
 * "Speak your tasks" — dictate a list out loud and turn it into individual
 * tasks. Transcription runs in the browser (Web Speech API); the transcript
 * is split into separate tasks at natural breaks, then shown as an editable
 * review list so nothing junk gets added. Nothing is sent anywhere.
 */

// Split spoken text into individual task titles.
function parseTasks(text: string): string[] {
  return text
    .split(/[\n.;•]+|,| and then | and also | then | also | next /i)
    .map((s) =>
      s
        .trim()
        // strip leading filler / connective words
        .replace(
          /^(and|then|also|next|um+|uh+|okay|ok|so|task|please|i need to|i have to|i want to|i've got to|i gotta|remember to|need to|got to|gotta)\b[:,]?\s*/i,
          ""
        )
        .replace(
          /^(and|then|also|i need to|i have to|remember to|need to)\b[:,]?\s*/i,
          ""
        )
        .trim()
    )
    .filter((s) => s.length >= 2)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .slice(0, 50);
}

export function VoiceTasks() {
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [defaultCategory, setDefaultCategory] = useState<"work" | "personal">("personal");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

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
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += t;
        else interimChunk += t;
      }
      if (finalChunk) {
        setTranscript((prev) => {
          const sep = prev && !/\s$/.test(prev) ? " " : "";
          return prev + sep + finalChunk.trim();
        });
      }
      setInterim(interimChunk);
    };
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was blocked. Allow the mic for this site and try again.");
        listeningRef.current = false;
        setListening(false);
      }
    };
    recognition.onend = () => {
      setInterim("");
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

  function toggleMic() {
    setError(null);
    setSavedMsg(null);
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
      // Auto-parse whatever was captured when you stop talking.
      turnIntoTasks();
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

  function turnIntoTasks() {
    const titles = parseTasks(transcript);
    if (!titles.length) return;
    setDrafts(
      titles.map((title, i) => ({ id: `${Date.now()}-${i}`, title, category: defaultCategory }))
    );
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((d) => d.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function removeDraft(id: string) {
    setDrafts((d) => d.filter((t) => t.id !== id));
  }

  async function addAll() {
    if (!drafts.length) return;
    setSaving(true);
    setError(null);
    const res = await addManyTasks(drafts.map((d) => ({ title: d.title, category: d.category })));
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn’t add tasks.");
      return;
    }
    setSavedMsg(res.message ?? "Added.");
    setDrafts([]);
    setTranscript("");
    router.refresh();
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-4 w-4" /> Speak your tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            Voice input isn’t available in this browser — you can still add tasks by typing below. (On
            iPhone, open the app in Safari for voice.)
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors",
                  listening
                    ? "bg-red-500/20 text-red-300 ring-1 ring-red-500"
                    : "bg-primary text-black"
                )}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? "Stop & review" : "Start talking"}
              </button>

              {/* Default list for parsed items */}
              <div className="flex rounded-md border border-border p-0.5 text-xs">
                {(["personal", "work"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDefaultCategory(c)}
                    className={cn(
                      "rounded px-3 py-1.5 font-medium capitalize transition-colors",
                      defaultCategory === c
                        ? "bg-primary text-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {listening ? (
              <p className="flex items-center gap-2 text-xs text-red-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Listening… say your tasks, separated by pauses or “and”. Tap “Stop &amp; review” when done.
              </p>
            ) : null}
          </>
        )}

        {/* Transcript (editable) */}
        <textarea
          value={interim ? `${transcript}${transcript && !/\s$/.test(transcript) ? " " : ""}${interim}` : transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={3}
          placeholder="What you say appears here — or type a list. e.g. “Email the accountant, book the dentist, finish the deck”"
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={turnIntoTasks}
            disabled={!transcript.trim()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40"
          >
            <Wand2 className="h-4 w-4" /> Turn into tasks
          </button>
          {transcript ? (
            <button
              type="button"
              onClick={() => {
                setTranscript("");
                setDrafts([]);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </div>

        {/* Review list */}
        {drafts.length ? (
          <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Review — {drafts.length} task{drafts.length === 1 ? "" : "s"}. Edit, switch list, or remove.
            </div>
            <ul className="space-y-1.5">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <input
                    value={d.title}
                    onChange={(e) => updateDraft(d.id, { title: e.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex shrink-0 rounded-md border border-border p-0.5 text-[11px]">
                    {(["work", "personal"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateDraft(d.id, { category: c })}
                        className={cn(
                          "rounded px-2 py-1 font-medium capitalize transition-colors",
                          d.category === c
                            ? "bg-primary text-black"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {c === "work" ? "Work" : "Personal"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDraft(d.id)}
                    aria-label="Remove"
                    className="shrink-0 text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addAll}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Adding…" : `Add ${drafts.length} task${drafts.length === 1 ? "" : "s"}`}
            </button>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {savedMsg ? <p className="text-sm text-emerald-400">✅ {savedMsg}</p> : null}
      </CardContent>
    </Card>
  );
}
