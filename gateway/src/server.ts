import crypto from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { InMemoryIdempotencyStore } from "./idempotency";
import { createRuntimeForwarder, type Forwarder } from "./forward";

export interface GatewayOptions {
  hmacSecret: string;
  runtimeUrl: string;
  bodyLimitBytes?: number;
  idempotencyStore?: InMemoryIdempotencyStore;
  forwarder?: Forwarder;
}

function normalizeHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function constantTimeEquals(expectedHex: string, providedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  if (expected.length !== provided.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, provided);
}

function extractSignature(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }
  return header.startsWith("sha256=") ? header.slice("sha256=".length) : header;
}

function getSignature(headers: Record<string, unknown>): string | undefined {
  return (
    normalizeHeader(headers["x-signature"] as string | string[] | undefined) ??
    normalizeHeader(headers["x-hub-signature-256"] as string | string[] | undefined) ??
    normalizeHeader(headers["x-webhook-signature"] as string | string[] | undefined)
  );
}

function getIdempotencyKey(headers: Record<string, unknown>): string | undefined {
  return normalizeHeader(headers["idempotency-key"] as string | string[] | undefined) ??
    normalizeHeader(headers["x-idempotency-key"] as string | string[] | undefined);
}

function parseJson(buffer: Buffer): unknown {
  const text = buffer.toString("utf8");
  return JSON.parse(text);
}

function validateBodyShape(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("webhook payload must be a JSON object");
  }
}

export function buildGatewayApp(options: GatewayOptions): FastifyInstance {
  const app = Fastify({
    logger: true,
    bodyLimit: options.bodyLimitBytes ?? 262_144,
  });
  const store = options.idempotencyStore ?? new InMemoryIdempotencyStore();
  const forwarder = options.forwarder ?? createRuntimeForwarder(options.runtimeUrl);

  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => {
    try {
      done(null, body);
    } catch (err) {
      done(err as Error);
    }
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/webhooks/:source", async (request, reply) => {
    const source = (request.params as { source: string }).source;
    const rawBody = request.body as Buffer;
    const signatureHeader = extractSignature(getSignature(request.headers as Record<string, unknown>));
    const idempotencyKey = getIdempotencyKey(request.headers as Record<string, unknown>);

    if (!signatureHeader) {
      return reply.code(401).send({
        error: "missing_signature",
        message: "Missing webhook signature",
      });
    }

    if (!idempotencyKey) {
      return reply.code(400).send({
        error: "missing_idempotency_key",
        message: "Missing idempotency key",
      });
    }

    if (store.has(idempotencyKey)) {
      return reply.code(409).send({
        error: "duplicate_idempotency_key",
        message: "Duplicate idempotency key",
      });
    }

    const expected = crypto.createHmac("sha256", options.hmacSecret).update(rawBody).digest("hex");
    if (!constantTimeEquals(expected, signatureHeader)) {
      return reply.code(403).send({
        error: "invalid_signature",
        message: "Invalid webhook signature",
      });
    }

    let payload: unknown;
    try {
      payload = parseJson(rawBody);
      validateBodyShape(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Malformed JSON";
      return reply.code(400).send({
        error: "malformed_json",
        message,
      });
    }

    try {
      await forwarder.forward({ source, payload, idempotencyKey });
      store.add(idempotencyKey);
      return reply.code(202).send({
        accepted: true,
        source,
        idempotency_key: idempotencyKey,
      });
    } catch (err) {
      request.log.error({ err }, "failed to enqueue webhook");
      return reply.code(502).send({
        error: "enqueue_failed",
        message: err instanceof Error ? err.message : "Failed to enqueue webhook",
      });
    }
  });

  return app;
}
