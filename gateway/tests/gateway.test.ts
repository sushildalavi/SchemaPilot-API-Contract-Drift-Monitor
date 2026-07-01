import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { InMemoryIdempotencyStore } from "../src/idempotency";
import { buildGatewayApp } from "../src/server";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("webhook gateway", () => {
  const secret = "test-secret";

  it("accepts a valid signature and enqueues successfully", async () => {
    const forwarder = { forward: vi.fn().mockResolvedValue(undefined) };
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      forwarder,
      idempotencyStore: new InMemoryIdempotencyStore(),
    });

    const body = JSON.stringify({ order_id: 1, amount: 42 });
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/shop",
      headers: {
        "content-type": "application/json",
        "x-signature": sign(secret, body),
        "x-idempotency-key": "idem-1",
      },
      payload: body,
    });

    expect(res.statusCode).toBe(202);
    expect(forwarder.forward).toHaveBeenCalledOnce();
    expect(JSON.parse(res.payload)).toMatchObject({ accepted: true, source: "shop" });
  });

  it("rejects a missing signature", async () => {
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      forwarder: { forward: vi.fn() },
      idempotencyStore: new InMemoryIdempotencyStore(),
    });

    const body = JSON.stringify({ ok: true });
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/shop",
      headers: {
        "content-type": "application/json",
        "x-idempotency-key": "idem-1",
      },
      payload: body,
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects an invalid signature", async () => {
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      forwarder: { forward: vi.fn() },
      idempotencyStore: new InMemoryIdempotencyStore(),
    });

    const body = JSON.stringify({ ok: true });
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/shop",
      headers: {
        "content-type": "application/json",
        "x-signature": "deadbeef",
        "x-idempotency-key": "idem-1",
      },
      payload: body,
    });

    expect(res.statusCode).toBe(403);
  });

  it("rejects a duplicate idempotency key", async () => {
    const forwarder = { forward: vi.fn().mockResolvedValue(undefined) };
    const store = new InMemoryIdempotencyStore();
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      forwarder,
      idempotencyStore: store,
    });

    const body = JSON.stringify({ ok: true });
    const headers = {
      "content-type": "application/json",
      "x-signature": sign(secret, body),
      "x-idempotency-key": "idem-dup",
    };

    const first = await app.inject({ method: "POST", url: "/webhooks/shop", headers, payload: body });
    const second = await app.inject({ method: "POST", url: "/webhooks/shop", headers, payload: body });

    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(409);
    expect(forwarder.forward).toHaveBeenCalledOnce();
  });

  it("rejects malformed JSON", async () => {
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      forwarder: { forward: vi.fn() },
      idempotencyStore: new InMemoryIdempotencyStore(),
    });

    const body = "{\"ok\":";
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/shop",
      headers: {
        "content-type": "application/json",
        "x-signature": sign(secret, body),
        "x-idempotency-key": "idem-1",
      },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.payload)).toMatchObject({ error: "malformed_json" });
  });

  it("returns an error when enqueue fails", async () => {
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      forwarder: { forward: vi.fn().mockRejectedValue(new Error("runtime down")) },
      idempotencyStore: new InMemoryIdempotencyStore(),
    });

    const body = JSON.stringify({ ok: true });
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/shop",
      headers: {
        "content-type": "application/json",
        "x-signature": sign(secret, body),
        "x-idempotency-key": "idem-1",
      },
      payload: body,
    });

    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.payload)).toMatchObject({ error: "enqueue_failed" });
  });

  it("rejects payloads over the configured body limit", async () => {
    const app = buildGatewayApp({
      hmacSecret: secret,
      runtimeUrl: "http://runtime.test/track",
      bodyLimitBytes: 32,
      forwarder: { forward: vi.fn() },
      idempotencyStore: new InMemoryIdempotencyStore(),
    });

    const body = JSON.stringify({ data: "x".repeat(128) });
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/shop",
      headers: {
        "content-type": "application/json",
        "x-signature": sign(secret, body),
        "x-idempotency-key": "idem-1",
      },
      payload: body,
    });

    expect(res.statusCode).toBe(413);
  });
});
