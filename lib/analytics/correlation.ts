/**
 * Lightweight correlation analytics. We compute a Pearson correlation
 * coefficient over paired observations and translate it into a
 * plain-English insight card. Deliberately simple — no stats library.
 */

export interface Insight {
  title: string;
  /** Pearson r in [-1, 1], or null when there isn't enough data. */
  r: number | null;
  n: number;
  message: string;
  strength: "none" | "weak" | "moderate" | "strong";
  direction: "positive" | "negative" | "none";
}

/** Pearson correlation over paired (x, y) values. */
export function pearson(pairs: Array<[number, number]>): number | null {
  const n = pairs.length;
  if (n < 3) return null; // not enough data to be meaningful

  let sx = 0,
    sy = 0,
    sxy = 0,
    sx2 = 0,
    sy2 = 0;
  for (const [x, y] of pairs) {
    sx += x;
    sy += y;
    sxy += x * y;
    sx2 += x * x;
    sy2 += y * y;
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
  if (den === 0) return null;
  return Math.max(-1, Math.min(1, num / den));
}

function strengthOf(r: number): Insight["strength"] {
  const a = Math.abs(r);
  if (a < 0.2) return "none";
  if (a < 0.4) return "weak";
  if (a < 0.6) return "moderate";
  return "strong";
}

/**
 * Build an insight card comparing two named metrics. `xLabel` is the
 * driver (e.g. "sleep score"), `yLabel` the outcome (e.g. "mood").
 */
export function buildInsight(
  title: string,
  xLabel: string,
  yLabel: string,
  pairs: Array<[number, number]>
): Insight {
  const r = pearson(pairs);
  const n = pairs.length;

  if (r === null) {
    return {
      title,
      r: null,
      n,
      strength: "none",
      direction: "none",
      message:
        n < 3
          ? "Not enough overlapping data yet. Keep logging — insights appear after a few days."
          : "No strong relationship detected yet. Keep collecting data.",
    };
  }

  const strength = strengthOf(r);
  const direction = r > 0 ? "positive" : r < 0 ? "negative" : "none";

  let message: string;
  if (strength === "none") {
    message = "No strong relationship detected yet. Keep collecting data.";
  } else {
    const higherLower = r > 0 ? "higher" : "lower";
    message = `When ${xLabel} is higher, ${yLabel} tends to be ${higherLower}. (${strength} ${direction} correlation, r = ${r.toFixed(
      2
    )}, n = ${n})`;
  }

  return { title, r, n, strength, direction, message };
}

/**
 * Join two date-keyed metric maps into paired observations for dates
 * present in both, filtering out missing values.
 */
export function pairByDate(
  x: Map<string, number | undefined | null>,
  y: Map<string, number | undefined | null>
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (const [date, xv] of x) {
    const yv = y.get(date);
    if (typeof xv === "number" && typeof yv === "number") {
      pairs.push([xv, yv]);
    }
  }
  return pairs;
}
