import { Router } from "express";
import passport from "passport";

import { AuthenticationController } from "@features/auth";
import { ProductController } from "@features/product";
import SyncController from "@features/product/sync.controller";
import ChatController from "@features/chat/chat.controller";
import SettingsController from "@features/settings/settings.controller";
import WebhookController from "@features/webhooks/webhook.controller";

const routes = Router();
routes.get("/auth/install", AuthenticationController.install);
routes.post(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.create
);

routes.get(
  "/products/total",
  passport.authenticate("jwt", { session: false }),
  ProductController.getTotal
);
routes.get(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.getAll
);
routes.delete(
  "/products/:id",
  passport.authenticate("jwt", { session: false }),
  ProductController.delete
);

// Product sync routes
routes.post(
  "/products/sync",
  passport.authenticate("jwt", { session: false }),
  SyncController.sync
);
routes.get(
  "/products/sync/status",
  passport.authenticate("jwt", { session: false }),
  SyncController.status
);
routes.get(
  "/products/placeholders",
  passport.authenticate("jwt", { session: false }),
  SyncController.placeholders
);

// Chat routes
routes.post(
  "/chat/sessions",
  passport.authenticate("jwt", { session: false }),
  ChatController.createSession
);
routes.post("/chat", ChatController.sendMessage);
routes.get(
  "/chat/sessions/:sessionId/history",
  passport.authenticate("jwt", { session: false }),
  ChatController.getHistory
);

// Settings routes
routes.get(
  "/settings",
  passport.authenticate("jwt", { session: false }),
  SettingsController.getSettings
);
routes.put(
  "/settings",
  passport.authenticate("jwt", { session: false }),
  SettingsController.updateSettings
);
routes.post(
  "/settings/reset",
  passport.authenticate("jwt", { session: false }),
  SettingsController.resetSettings
);

// Webhook routes (no auth, signature verification)
routes.post("/webhooks/product/create", WebhookController.productCreate);
routes.post("/webhooks/product/update", WebhookController.productUpdate);
routes.post("/webhooks/product/delete", WebhookController.productDelete);

export default routes;
