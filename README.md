# Messenger

This is the backend for the messaging app for the NGINX Microservices March demo architecture.

## Responsibility

Creating conversations, saving and storing messages. Providing access to messages and conversations.

This service notifies the system at large when a message is sent but does not take any action on message send other than saving the message.

## Requirements

This project requires either `NodeJS` or `Docker` to run. Using `NodeJS` will recreate a local development environment. Using `Docker` will let you recreate a pseudo production environment.

### NodeJS

This project uses `NodeJS`. The current version is specified in [`.tool-versions`](https://github.com/microservices-march/messenger/blob/main/.tool-versions). `NodeJS` is a rapidly evolving language which makes it critical to explicitly define which version is being used to avoid any potential errors due to mismatched versions.

We recommended that you use [asdf](https://asdf-vm.com/guide/getting-started.html) to manage your local `NodeJS` installation. Once you have `asdf` installed, you can run `asdf install` to automatically install the version of `NodeJS` specified in [`.tool-versions`](https://github.com/microservices-march/messenger/blob/main/.tool-versions).

<details>
<summary>

#### Why `asdf`?

</summary>
In a microservices environment, you may have to work on projects that use different versions of a runtime like `NodeJS`, or use a different language altogether!

[asdf](https://asdf-vm.com/guide/getting-started.html) is a single tool that lets you manage multiple versions of different languages in isolation and will automatically install and/or switch to the required runtime/version in any directory that has a `.tool-versions` file.

This is helpful in getting closer to [dev/prod parity](https://12factor.net/dev-prod-parity) in a microservices environment. As you can see in this project, the [GitHub action workflow](https://github.com/microservices-march/messenger/blob/main/.github/workflows/test.yml) uses the same version called out in [`.tool-versions`](https://github.com/microservices-march/messenger/blob/main/.tool-versions) to test the codebase and build a Docker image.

This way, if we use `asdf` we're guaranteed to be developing, testing, and releasing to a consistent version of NodeJS.

</details>

You can also install `NodeJS` by other means - just reference the version number in the `.tool-versions` file.

### Docker

You can run this project on a container using `Docker` together with `Docker Compose`. This will let you build a simple reproducible image and forget about setting up your local environment. Instructions on how to install `Docker` can be found in the [`Docker` website](https://docs.docker.com/get-docker/). (`Docker Compose` is included as part of the recommended `Docker` installation instructions.)

## Setup

**Note:** Instructions marked as (NodeJS - Dev) are only necessary if you want to recreate a local development environment. Instructions marked as (Docker - Prod) are only necessary if you want to recreate a pseudo production environment (careful, it's not actually production ready!).

1. Clone this repo:

   ```bash
   git clone https://github.com/microservices-march/messenger
   ```

2. Start the `messenger` service PostgreSQL database:

   ```bash
   docker-compose up -d
   ```

3. (Docker - Prod) From the root directory of this repository, build the `messenger` Docker image:

   ```bash
   # in ./app
   docker build -t messenger .
   ```

4. (Docker - Prod) Start the `messenger` service in a container:

   ```bash
   docker run --rm -d -p 4000:4000 --name messenger -e PGPASSWORD=postgres -e CREATE_DB_NAME=messenger -e PGHOST=messenger-db -e AMQPHOST=rabbitmq -e AMQPPORT=5672 -e PORT=4000 --network mm_2023 messenger
   ```

5. (Docker - Prod) SSH into the container to set up the PostgreSQL DB:

   ```bash
   docker exec -it messenger /bin/bash
   ```

6. (NodeJS - Dev) Install NodeJS modules:

   ```bash
   # in ./app
   npm install
   ```

7. Create the PostgreSQL DB:

   ```bash
   # in ./app
   PGDATABASE=postgres node scripts/create-db.mjs
   ```

8. Create the PostgreSQL DB tables:

   ```bash
   # in ./app
   node scripts/create-schema.mjs
   ```

9. Create some PostgreSQL DB seed data:

   ```bash
   # in ./app
   node scripts/create-seed-data.mjs
   ```

10. (NodeJS - Dev) Start the service:

    ```bash
    # in ./app
    node index.mjs
    ```

## Using the Service

Once the messenger service is running:

1. Create a conversation:

   ```bash
   curl -d '{"participant_ids": [1, 2]}' -H "Content-Type: application/json" -X POST http://localhost:4000/conversations
   ```

2. Send a message to the conversation from a user (user 1):

   ```bash
   curl -d '{"content": "This is the first message"}' -H "User-Id: 1" -H "Content-Type: application/json" -X POST 'http://localhost:4000/conversations/1/messages'
   ```

3. Reply with a message from a different user (user 2):

   ```bash
   curl -d '{"content": "This is the second message"}' -H "User-Id: 2" -H "Content-Type: application/json" -X POST 'http://localhost:4000/conversations/1/messages'
   ```

4. Fetch the messages:

   ```bash
   curl -X GET http://localhost:4000/conversations/1/messages
   ```

5. Set the "view horizon" for the first user:

   ```bash
   curl -i -d '{"index": 2}' -H "User-Id: 1" -H "Content-Type: application/json" -X POST 'http://localhost:4000/conversations/1/view_horizon'
   ```

## Application Notes

The configuration data for this application can be seen in the [configuration schema](https://github.com/microservices-march/messenger/blob/main/config/config.mjs).

This application serves as a simple example of a service handling messages that are durably stored. However, it intentionally does not do a few things for the sake of simplicity:

- No effort has been made to be sure that administrators cannot view messages
- Pagination is not implemented on any endpoints
- Message storage is being done in a simple relational database. No design has been done to handle fast retrieval of newer messages and other performance concerns.
- The message insertion SQL has not been optimized to handle high write volumes

### View Horizon

The application assigns a monotonically increasing `index` to each message within a conversation. This index is used to determine whether a member of a conversation has seen a message or not. In the `users_channels` table, we store the index of the last message the user has seen in that conversation.

Any messages with an `index` higher than than `index` are said not to have been seen by the user.

### A Note on Code and Style

The code for this example is written in a style that not in line with application development best practices.

Instead, it is optimized to be quickly understood by those seeking to understand the Microservices March Demo Architecture without assuming special familiarity with:

- Javascript
- NodeJS
- Express

Therefore, we've opted to:

- Avoid frameworks that have domain specific languages (ie, database libraries)
- Avoid splitting up code into many different files

## Cleanup

If you want to cleanup any artifacts resulting from running this project, run:

- If you used `NodeJS` to run the project:

  ```bash
  rm -rf node_modules
  ```

- If you used `Docker` to run the project:

  ```bash
  docker rmi messenger
  ```

## Development

Read the [`CONTRIBUTING.md`](https://github.com/microservices-march/messenger/blob/main/CONTRIBUTING.md) file for instructions on how to best contribute to this repository.

## License

[Apache License, Version 2.0](https://github.com/microservices-march/messenger/blob/main/LICENSE)

&copy; [F5 Networks, Inc.](https://www.f5.com/) 2023
