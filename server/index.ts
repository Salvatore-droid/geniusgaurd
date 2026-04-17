import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes";
import { startScheduler } from "./scheduler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json()); // Enable JSON body parsing

  // Register API routes
  app.use("/api", routes);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Only serve static files if NOT in development (Vite handles frontend in dev)
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(staticPath));

    // Handle client-side routing - serve index.html for all routes
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  // Default to 5000 to avoid conflict with Vite (3000)
  const port = process.env.PORT || 5000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startScheduler();
  });
}

startServer().catch(console.error);
