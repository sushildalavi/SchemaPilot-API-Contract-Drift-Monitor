export interface ForwardWebhookInput {
  source: string;
  payload: unknown;
  idempotencyKey: string;
}

export interface Forwarder {
  forward(input: ForwardWebhookInput): Promise<void>;
}

export function createRuntimeForwarder(runtimeUrl: string): Forwarder {
  return {
    async forward(input: ForwardWebhookInput): Promise<void> {
      const response = await fetch(runtimeUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-idempotency-key": input.idempotencyKey,
        },
        body: JSON.stringify({
          namespace: "gateway",
          service_name: input.source,
          http_method: "POST",
          route_path: `/webhooks/${input.source}`,
          payload: input.payload,
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(
          `runtime ingestion failed with HTTP ${response.status}${details ? `: ${details}` : ""}`,
        );
      }
    },
  };
}
