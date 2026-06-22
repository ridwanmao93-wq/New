import { createApp } from "./app";
import { env } from "./config/env";
import { startOuraCron } from "./cron/syncOuraDaily";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Performance dashboard running on http://localhost:${env.PORT}`);
  console.log(`   Dashboard: http://localhost:${env.PORT}/dashboard`);
  startOuraCron();
});

// Graceful shutdown.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(() => process.exit(0));
  });
}
