import "dotenv/config";
import "./types";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeScheduler } from "../scheduler";
import { closeDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy for correct IP and secure cookies when behind reverse proxy
  app.set("trust proxy", 1);
  
  // Request ID middleware
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.locals.requestId = req.requestId;
    next();
  });

  // Security middleware
  app.use(helmet());

  // Rate limiting
  const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: "Too many OAuth requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const trpcLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many API requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters
  app.use("/api/oauth", oauthLimiter);
  app.use("/api/trpc", trpcLimiter);

  // Configure body parser with reasonable size limit
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Initialize scheduler for automated tasks
    initializeScheduler();
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      console.log("[Server] HTTP server closed");
      await closeDb();
      process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(console.error);
