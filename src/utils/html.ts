/**
 * Minimal HTML rendering helpers. Rather than pull in a templating
 * engine, the few pages we serve (forms + dashboard) are built from
 * small string helpers. Keeps the project lean and easy to deploy.
 */

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BASE_STYLE = `
  :root { --bg:#0f1419; --card:#1a2230; --accent:#4f9dff; --text:#e6edf3; --muted:#8b98a5; --good:#3fb950; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 0; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 24px 16px 64px; }
  header h1 { font-size: 22px; margin: 0 0 4px; }
  header p { color: var(--muted); margin: 0 0 20px; }
  nav { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; }
  nav a { background: var(--card); color: var(--text); text-decoration:none; padding:8px 12px; border-radius:8px; font-size:14px; }
  nav a:hover { background:#26344a; }
  .card { background: var(--card); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  label { display:block; font-size:14px; margin: 14px 0 4px; color: var(--text); }
  .hint { color: var(--muted); font-size: 12px; }
  input, textarea, select { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #2b3648; background:#0d1420; color:var(--text); font-size:14px; }
  textarea { min-height: 70px; resize: vertical; }
  button { margin-top:20px; background: var(--accent); color:#001; border:none; padding:12px 18px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; }
  button:hover { filter: brightness(1.08); }
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:12px; }
  .stat { background: var(--card); border-radius:12px; padding:16px; }
  .stat .v { font-size:26px; font-weight:700; }
  .stat .l { color:var(--muted); font-size:13px; margin-top:4px; }
  table { width:100%; border-collapse: collapse; font-size:14px; }
  th, td { text-align:left; padding:8px 10px; border-bottom:1px solid #26344a; }
  th { color: var(--muted); font-weight:600; }
  .ok { color: var(--good); }
  .banner { background:#16331e; color:#7ee787; padding:12px 16px; border-radius:8px; margin-bottom:16px; }
  h2 { font-size:16px; margin: 24px 0 10px; }
`;

const NAV = `
  <nav>
    <a href="/dashboard">Dashboard</a>
    <a href="/morning">Morning CBT</a>
    <a href="/evening">Evening CBT</a>
    <a href="/workout">Workout</a>
    <a href="/weight">Weight</a>
    <a href="/hydration">Hydration</a>
  </nav>
`;

export function page(title: string, body: string, subtitle = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    </header>
    ${NAV}
    ${body}
  </div>
</body>
</html>`;
}

/** Render a simple success page after a form submit. */
export function successPage(what: string, backHref: string): string {
  return page(
    "Saved ✓",
    `<div class="banner">✅ ${escapeHtml(what)} saved to Airtable.</div>
     <div class="card">
       <p>You can submit another entry or head back to the dashboard.</p>
       <p><a href="${escapeHtml(backHref)}">Add another</a> &nbsp;·&nbsp; <a href="/dashboard">Dashboard</a></p>
     </div>`
  );
}

/** Render an error page. */
export function errorPage(message: string, backHref: string): string {
  return page(
    "Something went wrong",
    `<div class="card">
       <p style="color:#ff7b72">⚠️ ${escapeHtml(message)}</p>
       <p><a href="${escapeHtml(backHref)}">Go back</a></p>
     </div>`
  );
}

// --- small form field builders ---

export function numberField(
  name: string,
  label: string,
  opts: { min?: number; max?: number; step?: string; required?: boolean; hint?: string } = {}
): string {
  const attrs = [
    `name="${name}"`,
    `type="number"`,
    opts.min !== undefined ? `min="${opts.min}"` : "",
    opts.max !== undefined ? `max="${opts.max}"` : "",
    opts.step ? `step="${opts.step}"` : "",
    opts.required ? "required" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<label>${escapeHtml(label)}${opts.required ? " *" : ""}</label>
    <input ${attrs} />
    ${opts.hint ? `<div class="hint">${escapeHtml(opts.hint)}</div>` : ""}`;
}

export function textField(
  name: string,
  label: string,
  opts: { required?: boolean; placeholder?: string } = {}
): string {
  return `<label>${escapeHtml(label)}${opts.required ? " *" : ""}</label>
    <input name="${name}" type="text" ${opts.required ? "required" : ""} placeholder="${escapeHtml(
      opts.placeholder || ""
    )}" />`;
}

export function textArea(name: string, label: string): string {
  return `<label>${escapeHtml(label)}</label><textarea name="${name}"></textarea>`;
}

export function dateField(): string {
  return `<label>Date</label>
    <input name="date" type="date" />
    <div class="hint">Leave blank to use today.</div>`;
}
