import convict from "convict";

const config = convict({
  env: {
    doc: "The application environment",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: null,
    env: "PORT",
    arg: "port",
  },
  pguser: {
    doc: "The postgres user that the application will use",
    format: "*",
    default: null,
    env: "PGUSER",
    arg: "pguser",
  },
  pghost: {
    doc: "The host of the postgres server",
    format: "*",
    default: null,
    env: "PGHOST",
    arg: "pghost",
  },
  pgport: {
    doc: "The port on which the postgres database will be listening",
    format: "port",
    default: null,
    env: "PGPORT",
    arg: "pgport",
  },
  pgdatabase: {
    doc: "The name of the postgres databse",
    format: String,
    default: null,
    env: "PGDATABASE",
    arg: "pgdatabase",
  },
  pgpassword: {
    doc: "The password for the postgres database",
    format: String,
    default: null,
    env: "PGPASSWORD",
    arg: "pgpassword",
    sensitive: true,
  },
  amqphost: {
    doc: "host for the amqp broker",
    format: String,
    default: null,
    env: "AMQPHOST",
    arg: "amqphost",
  },
  amqpport: {
    doc: "port for the amqp broker",
    format: "port",
    default: null,
    env: "AMQPPORT",
    arg: "amqpport",
  }
});

const env = config.get("env");
config.loadFile(`./config/${env}.json`);

config.validate({ allowed: "strict" });

export default config;
