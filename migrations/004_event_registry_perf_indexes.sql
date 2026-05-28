CREATE INDEX IF NOT EXISTS ix_consumer_subscriptions_endpoint_active_version
ON consumer_subscriptions(endpoint_id, active, schema_version);

CREATE INDEX IF NOT EXISTS ix_contract_schema_versions_endpoint_fingerprint
ON contract_schema_versions(endpoint_id, fingerprint);

CREATE INDEX IF NOT EXISTS ix_contract_registry_endpoints_lookup
ON contract_registry_endpoints(namespace, service_name, http_method, route_path);
