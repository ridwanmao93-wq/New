import express from "express";

import morning from "./routes/morning";
import evening from "./routes/evening";
import workout from "./routes/workout";
import weight from "./routes/weight";
import hydration from "./routes/hydration";
import ouraSync from "./routes/ouraSync";
import scorecard from "./routes/scorecard";
import exportsRouter from "./routes/exports";
import dashboard from "./routes/dashboard";
import { page } from "./utils/html";

/**
 * Build the Express application. Kept separate from server.ts so it can
 * be imported in tests or serverless handlers without binding a port.
 */
export function createApp() {
  const app = express();

  app.use(express.urlencoded({ extended: true })); // HTML form posts
  app.use(express.json()); // API posts

  // Health check (useful for Render / Railway).
  app.get("/healthz", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  // Landing page → links to everything.
  app.get("/", (_req, res) => {
    res.send(
      page(
        "Personal Performance Dashboard",
        `<div class="card">
           <p>Welcome. Use the navigation above, or jump straight to the
           <a href="/dashboard">dashboard</a>.</p>
           <h2>Daily practice</h2>
           <p><a href="/morning">Morning CBT</a> · <a href="/evening">Evening CBT</a></p>
           <h2>Tracking</h2>
           <p><a href="/workout">Workout</a> · <a href="/weight">Weight</a> · <a href="/hydration">Hydration</a></p>
           <h2>Looker Studio exports</h2>
           <p class="hint">Append <code>?format=csv</code> to any export for CSV.</p>
           <ul>
             <li><a href="/api/export/daily-health">/api/export/daily-health</a></li>
             <li><a href="/api/export/cbt">/api/export/cbt</a></li>
             <li><a href="/api/export/workouts">/api/export/workouts</a></li>
             <li><a href="/api/export/weight">/api/export/weight</a></li>
             <li><a href="/api/export/hydration">/api/export/hydration</a></li>
             <li><a href="/api/export/weekly-scorecard">/api/export/weekly-scorecard</a></li>
           </ul>
         </div>`,
        "Oura · Hydration · CBT · Workouts · Weight"
      )
    );
  });

  // Form pages + their POST handlers.
  app.use(morning);
  app.use(evening);
  app.use(workout);
  app.use(weight);
  app.use(hydration);

  // API routes.
  app.use(ouraSync);
  app.use(scorecard);
  app.use(exportsRouter);

  // Dashboard.
  app.use(dashboard);

  // 404 fallback.
  app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

  return app;
}
