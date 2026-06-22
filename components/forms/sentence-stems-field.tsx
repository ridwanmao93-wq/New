"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STEMS = [
  "If I lived more consciously today, I would…",
  "If I fully accepted myself, I would…",
  "If I took responsibility for my happiness today, I would…",
  "If I acted with purpose and integrity today, I would…",
];

const MIN_RESPONSES = 5;
const MAX_RESPONSES = 10;

interface StemState {
  stem: string;
  responses: string[];
}

/**
 * Step 3 of the morning practice: choose 2–3 stems, each with 5–10
 * short responses. Self-contained — renders a hidden input named
 * `sentence_stems` containing the JSON the server action expects.
 */
export function SentenceStemsField() {
  const [selected, setSelected] = useState<Record<string, StemState>>({});
  const count = Object.keys(selected).length;

  const payload = Object.values(selected).map((s) => ({
    stem: s.stem,
    responses: s.responses.map((r) => r.trim()).filter(Boolean),
  }));

  function toggle(stem: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[stem]) delete next[stem];
      else if (Object.keys(next).length < 3)
        next[stem] = { stem, responses: Array(MIN_RESPONSES).fill("") };
      return next;
    });
  }

  function setResponse(stem: string, i: number, value: string) {
    setSelected((prev) => {
      const responses = [...prev[stem].responses];
      responses[i] = value;
      return { ...prev, [stem]: { ...prev[stem], responses } };
    });
  }

  function addResponse(stem: string) {
    setSelected((prev) =>
      prev[stem].responses.length >= MAX_RESPONSES
        ? prev
        : { ...prev, [stem]: { ...prev[stem], responses: [...prev[stem].responses, ""] } }
    );
  }

  function removeResponse(stem: string) {
    setSelected((prev) =>
      prev[stem].responses.length <= MIN_RESPONSES
        ? prev
        : { ...prev, [stem]: { ...prev[stem], responses: prev[stem].responses.slice(0, -1) } }
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose 2–3 stems; write 5–10 short completions each ({count}/3 selected).
      </p>
      <input type="hidden" name="sentence_stems" value={JSON.stringify(payload)} />
      {STEMS.map((stem) => {
        const active = !!selected[stem];
        return (
          <Card key={stem} className={active ? "border-primary/50" : ""}>
            <CardHeader className="p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                <input type="checkbox" checked={active} onChange={() => toggle(stem)} className="h-4 w-4" />
                {stem}
              </label>
            </CardHeader>
            {active ? (
              <CardContent className="space-y-2 p-4 pt-0">
                {selected[stem].responses.map((val, i) => (
                  <Input
                    key={i}
                    value={val}
                    placeholder={`Response ${i + 1}`}
                    onChange={(e) => setResponse(stem, i, e.target.value)}
                  />
                ))}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addResponse(stem)}
                    disabled={selected[stem].responses.length >= MAX_RESPONSES}
                  >
                    + Add response
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResponse(stem)}
                    disabled={selected[stem].responses.length <= MIN_RESPONSES}
                  >
                    − Remove
                  </Button>
                </div>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
