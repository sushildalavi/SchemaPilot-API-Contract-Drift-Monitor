import { buildGatewayApp } from "./server";

const hmacSecret = process.env.WEBHOOK_HMAC_SECRET;
const runtimeUrl = process.env.RUNTIME_INGEST_URL ?? "http://localhost:8018/track";
const port = Number(process.env.PORT ?? "3000");

if (!hmacSecret) {
  throw new Error("WEBHOOK_HMAC_SECRET is required");
}

const app = buildGatewayApp({
  hmacSecret,
  runtimeUrl,
  bodyLimitBytes: Number(process.env.WEBHOOK_MAX_BODY_BYTES ?? "262144"),
});

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
