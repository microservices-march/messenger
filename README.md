# Messenger

This is the backend for the messaging app for the NGINX Microservices March Demo Architecture

## Responsibility

Creating conversations, saving and storing messages. Providing access to messages and conversations.

This service notifies the system at large when a message is sent but does not
take any action on message send other than saving the message.

## Getting started

1. Run `docker-compose up` to start the postgres database
1. Create the db: `PGDATABASE=postgres node bin/create-db.mjs`
1. Create the tables `node bin/create-schema.mjs`
1. Supply seed data `node bin/create-seed-data.mjs`
1. Make your `.env` file. `cp .env.sample .env`
1. Run `node index.mjs` to start the service

## Using the Service

1. Create a conversation: `curl -d '{"participant_ids": [1, 2]}' -H "Content-Type: application/json" -X POST http://localhost:8080/conversations`
1. Send a message to the conversation from user 1: `curl -d '{"content": "This is the first message", "user_id": 1}' -H "Content-Type: application/json" -X POST 'http://localhost:8080/conversations/1/messages'`
1. Send another message from the other user: `curl -d '{"content": "This is the second message", "user_id": 2}' -H "Content-Type: application/json" -X POST 'http://localhost:8080/conversations/1/messages'`
1. Fetch the messages: `curl -X GET http://localhost:8080/conversations/1/message`
1. Set the "view horizon" for the first user: `curl -i -d '{"index": 2, "user_id": 1}' -H "Content-Type: application/json" -X POST 'http://localhost:8080/conversations/1/view_horizon'`

## Application Notes
This application serves as a simple example of a service handling messages that are durably stored.  However, it intentionally does not do a few things for the sake of simplicity:

* No effort has been made to be sure that administrators cannot view messages
* Pagination is not implemented on any endpoints
* Message storage is being done in a simple relational database.  No design has been done to handle fast retrieval of newer messages and other performance concerns.
* The message insertion SQL has not been optimized to handle high write volumes

### View Horizon
The application assigns a monotonically increasing `index` to each message within a conversation. This index is used to determine whether a member of a conversation has seen a message or not.  In the `users_channels` table, we store the index of the last message the user has seen in that conversation.

Any messages with an index higher than than index are said not to have been seen by the user.

## A note on code and style

The code for this example is written in a style that not in line with application development best practices.

Instead, it is optimized to be quickly understood by those seeking to understand the Microservices March Demo Architecture without assuming special familiarity with:

- Javascript
- NodeJS
- Express

Therefore, we've opted to:

- Avoid frameworks that have domain specific languages (ie, database libraries)
- Avoid splitting up code into many different files
