!/bin/bash

## TODO: grab all these values from somewhere


docker run -d --rm --name messenger-db-b -v db-data:/var/lib/postgresql/data/pgdata -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=messenger -e PGDATA=/var/lib/postgresql/data/pgdata --network mm_2023 postgres:15.1

curl -X PUT http://localhost:8500/v1/kv/messenger-db-port  -H "Content-Type: application/json" -d '5432'
curl -X PUT http://localhost:8500/v1/kv/messenger-db-host  -H "Content-Type: application/json" -d 'messenger-db-a'