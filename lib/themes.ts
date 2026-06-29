/**
 * Lightweight theme extraction for free-form journaling. Pulls the most
 * frequent meaningful words and 2-word phrases across a set of texts —
 * no NLP dependency, just frequency with stop-words removed.
 */

const STOP = new Set([
  "the","and","that","this","with","from","into","about","would","could","should","there",
  "their","them","they","your","youre","have","just","like","really","what","when","where",
  "which","while","because","been","being","were","cant","dont","didnt","doesnt","wont",
  "still","then","than","some","much","more","less","very","over","under","also","even","only",
  "want","need","feel","feeling","felt","think","thought","know","going","gonna","today","day",
  "time","things","thing","something","anything","everything","myself","make","made","take",
  "good","bad","get","got","one","out","but","for","not","are","was","its","im","ive","id",
  "will","can","had","has","did","does","done","onto","upon","such","most","many","every",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z']{1,}/g) ?? [])
    .map((w) => w.replace(/'/g, ""))
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

export interface Theme {
  phrase: string;
  count: number;
}

/**
 * Return up to `limit` recurring themes (appearing at least `minCount`
 * times). 2-word phrases are favoured slightly over single words because
 * they read as real themes ("job search", "self doubt").
 */
export function extractThemes(texts: string[], limit = 14, minCount = 2): Theme[] {
  const counts = new Map<string, number>();
  const bump = (k: string, by = 1) => counts.set(k, (counts.get(k) ?? 0) + by);

  for (const text of texts) {
    const toks = tokenize(text);
    for (const w of toks) if (w.length >= 4) bump(w);
    for (let i = 0; i < toks.length - 1; i++) bump(`${toks[i]} ${toks[i + 1]}`, 1.4); // weight phrases
  }

  return [...counts.entries()]
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase, count]) => ({ phrase, count: Math.round(count) }));
}
