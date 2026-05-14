import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import shopifyWebhookRouter from "./routes/shopify-webhook";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Mount webhook routes BEFORE express.json() so express.raw() can intercept
// the raw body stream before it is consumed. Shopify sends webhooks as
// application/json and signs the raw bytes — if express.json() runs first it
// sets req._body = true and express.raw() skips, making HMAC validation
// impossible.
app.use("/api", shopifyWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
