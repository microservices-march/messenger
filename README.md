# Messenger

This is the backend for the messaging app for the NGINX Microservices March Demo Architecture

## Responsibility

Drive the messaging service and store messages

## Getting started

1. Run `docker-compose up` to start the postgres database
1. Create the db: `PGDATABASE=postgres node bin/create-db.mjs`
1. Create the tables `node bin/create-schema.mjs`
1. Supply seed data `node bin/create-seed-data.mjs`
1. Run `node index.mjs` to start the service

## Using the Service

1. Create a conversation: `curl -d '{"participant_ids": [1, 2]}' -H "Content-Type: application/json" -X POST http://localhost:8080/conversations`
1. Send a message to the conversation from user 1: `curl -d '{"content": "This is the first message", "user_id": 1}' -H "Content-Type: application/json" -X POST 'http://localhost:8080/conversations/1/messages'`
1. Send another message from the other user: `curl -d '{"content": "This is the second message", "user_id": 2}' -H "Content-Type: application/json" -X POST 'http://localhost:8080/conversations/1/messages'`
1. Fetch the messages: `curl -X GET http://localhost:8080/conversations/1/message`
1. Set the "view horizon" for the first user: `curl -i -d '{"index": 2, "user_id": 1}' -H "Content-Type: application/json" -X POST 'http://localhost:8080/conversations/1/view_horizon'`

## A note on code and style

The code for this example is written in a style that not in line with application development best practices.

Instead, it is optimized to be quickly understood by those seeking to understand the Microservices March Demo Architecture without assuming special familiarity with:

- Javascript
- NodeJS
- Express

Therefore, we've opted to:

- Avoid frameworks that have domain specific languages (ie, database libraries)
- Avoid splitting up code into many different files
