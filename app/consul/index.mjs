import ip from "ip";
import Consul from "consul";
import config from "../config/config.mjs";
import { v4 as uuidv4 } from "uuid";

const CONSUL_HOST = config.get("consulHost");
const CONSUL_PORT = config.get("consulPort");

// Information about our service we will need to supply to consul
const SERVICE_HOST = ip.address();
const SERVICE_PORT = config.get("port");
const HEALTH_CHECK_URL = `http://${SERVICE_HOST}:${SERVICE_PORT}/health`;

// Information we'll use for the consul service definition
const CONSUL_ID = uuidv4(); // the id in consul for this instance of the app
const CONSUL_SERVICE_NAME = config.get("consulServiceName");

let consul;
if (CONSUL_SERVICE_NAME) {
  consul = new Consul({
    host: CONSUL_HOST,
    port: CONSUL_PORT,
  });
}

// This is all the information we will pass to consul
// to be added to the service registry.
// Notice that we also tell it how to check the health
// of the service, and define when the service should be removed
// from the registry
const serviceDefinition = {
  name: CONSUL_SERVICE_NAME,
  address: SERVICE_HOST,
  port: SERVICE_PORT,
  id: CONSUL_ID,
  check: {
    http: HEALTH_CHECK_URL,
    interval: "15s",
    deregister_critical_service_after: "1m",
  },
};

// Deregister the service from Consul when we shut it down normally
const doGracefulShutdown = async () => {
  if (!consul) return;
  await consul.agent.service.deregister({ id: CONSUL_ID });
};

export const register = async () => {
  if (!consul) return;

  // This is where the actual registration will happen
  await consul.agent.service.register(serviceDefinition);

  // Deregister when we get SIGTERM or SIGINT.
  // It's not gauranteed that this code will be run
  // but if it cannot be run (due to the app crashing for example)
  // then the service will start failing health checks
  // and get deregistered automatically.
  process.on("SIGTERM", doGracefulShutdown);
  process.on("SIGINT", doGracefulShutdown);
};
