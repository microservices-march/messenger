import ip from "ip";
import Consul from "consul";
import config from "../config/config.mjs";
import { v4 as uuidv4 } from 'uuid';

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
    port: CONSUL_PORT
  });
}

const serviceDefinition = {
  name: CONSUL_SERVICE_NAME,
  address: SERVICE_HOST,
  port: SERVICE_PORT,
  id: CONSUL_ID,
  check: {
    http: HEALTH_CHECK_URL,
    interval: "15s",
    deregister_critical_service_after: '1m'
  }
};

const doGracefulShutdown = async () => {
  if (!consul) return;
  await consul.agent.service.deregister({id: CONSUL_ID});
}

export const register = async () => {
  if (!consul) return;

  await consul.agent.service.register(serviceDefinition);

  process.on("SIGTERM", doGracefulShutdown);
  process.on("SIGINT", doGracefulShutdown);
}
