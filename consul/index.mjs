import ip from "ip";
import Consul from "consul";
import config from "../config/config.mjs";
import { v4 as uuidv4 } from 'uuid';

const CONSUL_ID = uuidv4();
const HOST = ip.address();
const HEALTH_CHECK_URL = `http://${HOST}:${config.get("port")}/health`;
const CONSUL_SERVICE_NAME = config.get("consulServiceName");

let consul;
if (config.get("env") === "production") {
  consul = new Consul({
    host: config.get("consulHost"),
    port: config.get("consulPort")
  });
}

const serviceDefinition = {
  name: CONSUL_SERVICE_NAME,
  address: HOST,
  port: config.get("port"),
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
