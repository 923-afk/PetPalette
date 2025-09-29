import express from "express";
import { registerRoutes } from "../server/routes";

let app: ReturnType<typeof express> | null = null;

async function getApp() {
  if (!app) {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    await registerRoutes(app);
  }
  return app;
}

export default async function handler(req: any, res: any) {
  const application = await getApp();
  // Vercel strips the "/api" prefix before invoking this function.
  // Our Express routes are defined with "/api/*" paths. Add the prefix back.
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : `/${req.url}`);
  }
  return (application as any)(req, res);
}

