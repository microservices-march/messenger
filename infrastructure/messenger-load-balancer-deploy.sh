#!/bin/bash
set -e

# Consul host and port are included in each host since we
# cannot query consul until we know them
CONSUL_CLIENT_HOST="${CONSUL_CLIENT_HOST}"
CONSUL_CLIENT_PORT="${CONSUL_CLIENT_PORT}"

docker run \
  --rm \
  --name messenger-lb \
  -e CONSUL_URL="${CONSUL_CLIENT_HOST}:${CONSUL_CLIENT_PORT}"  \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318/ \
  -e OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
  -e OTEL_SERVICE_NAME=messenger-lb \
  -p 80:80 \
  --network mm_2023 \
  messenger-lb


  # CONSUL_CLIENT_HOST=consul-client CONSUL_CLIENT_PORT=8500 ./infrastructure/messenger-load-balancer-deploy.sh 
