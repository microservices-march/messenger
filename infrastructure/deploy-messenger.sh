TODO: pass through the how env vars.  Maybe filtered?
docker run --rm --name messenger-12 -e PGPASSWORD=postgres -e CREATE_DB_NAME=messenger -e PGHOST=messenger-db-1 -e AMQPHOST=rabbitmq -e AMQPPORT=5672 -e PORT=4000 --network mm_2023 messenger