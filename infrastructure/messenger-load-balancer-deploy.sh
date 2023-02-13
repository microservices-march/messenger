#!/bin/bash
set -e

# Consul host and port are included in each host since we
# cannot query consul until we know them
CONSUL_CLIENT_HOST="${CONSUL_CLIENT_HOST}"
CONSUL_CLIENT_PORT="${CONSUL_CLIENT_PORT}"

docker run \
  --rm \
  -d \
  --name messenger-lb \
  -e CONSUL_URL="${CONSUL_CLIENT_HOST}:${CONSUL_CLIENT_PORT}"  \
  -p 8085:8085 \
  --network mm_2023 \
  messenger-lb
  