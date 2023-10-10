# Load Balancer
The `messenger` application is fronted by a simple load balancer defined in a docker container here.

You can set up a demo which considers this an entrypoint to the whole demo setup, or just use it as a load balancer that fronts multiple instances of the `messenger` application.

In this branch, it is set up with the official [NGINX Opentelemetry Module](https://github.com/nginxinc/nginx-otel).

## Building
To build the image, it's nice to build multiple versions so that arm and x86 devices can both use it.  Here is the command for that with the tag being `lb`
```bash
docker buildx build --platform linux/arm64,linux/amd64 --load -t lb .
```

However, building for architectures you don't need can take a long time (on my m1 macbook the x86 build takes upwards of 30 minutes, whereas the arm buid finishes in 10).  So if you're just playing around, build only for your architecture.

## Running
To run the container, use a command like this:
```bash
docker run --rm --name lb -v $HOME/code/microservices_march/messenger/load-balancer/nginx.conf:/etc/nginx/nginx.conf -p 8085:8085 --platform linux/arm64 lb
```

Adjust the `platform` tag and `-v` flag for your system.  If you're happy with the `nginx.conf` in this directory, you can omit the `-v` flag but it's nice to have when you're making changes to configuration in development.

The platform tag isn't strictly necessary since docker will choose the right image automatically. Howver it makes me feel better.

## An End to End example
This example uses the [demo architecture](https://github.com/microservices-march) of which this project is a part.  It roughly follows the flow of [this blog post](https://www.nginx.com/blog/nginx-tutorial-opentelemetry-tracing-understand-microservices/) but swaps out the community-maintained NGINX Opentelemetry solution for the official package.

### What are the differences?
The community package can be found [here](https://github.com/open-telemetry/opentelemetry-cpp-contrib/tree/main/instrumentation/otel-webserver-module#nginx-webserver-module).  The two modules differ in the following ways:

|                        | Official                                     | Community                                                                                                                     |
|------------------------|----------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Installation           | Dynamic Module                               | Dynamic Module                                                                                                                |
| Supported Architecture | ARM and x86                                  | x86 only                                                                                                                      |
| Supported NGINX        | 1.25.2 and up                                | 1.22.0, 1.23.0,1.23.1 May be compatible with older or newer versions. Versions 1.18.0 and below are explicitly not supported. |
| Configuration          | NGINX directives                             | Configuration file                                                                                                            |
| Spans                  | Single Span per request. Cannot be changed   | 1 parent and 11 child spans per request depending on modules installed. Cannot be changed.                                    |
| Custom Attributes      | Yes                                          | Yes (but only request and response headers may be added as custom attributes)                                                 |
| Sampling               | Yes                                          | Yes (configuration options unclear.  Appears to be "on" or "off")                                                             |
| Focus                  | Performance, NGINX configuration integration | NGINX and HAProxy. Detailed reporting                                                                                         |

### Setting up the Demo
You can follow the steps in this [blog post](https://www.nginx.com/blog/nginx-tutorial-opentelemetry-tracing-understand-microservices/) **UNTIL** [this section](https://www.nginx.com/blog/nginx-tutorial-opentelemetry-tracing-understand-microservices/#instrument-nginx).  At that point you'll follow do the following:

#### Build the Image
Before you build, make sure that the `nginx.conf` is set up as you'd like it.  Don't worry too much about it since you can experiment later when you run the container by mounting the config file.

```
docker buildx build --platform linux/arm64,linux/amd64 --load -t lb .
```
You can remove any platforms you don't need.

#### Make sure the `messenger` service is set up and running.
Follow the steps in the main README to set up the database.  Then start the application from the `/app` directory like this:
```bash
node --import ./tracing.mjs index.mjs
```
#### Start the NGINX docker container
```bash
docker run --rm --name lb -p 8085:8085 --network mm_2023  lb
```
The `--network` flag is to let it communicate with the opentelemetry collector since all the components of the demo architecture are on the same docker network.

#### Set up the observability tooling
Check out the [platform repository](https://github.com/microservices-march/platform)

Run `docker compose up -d` to start observability tooling.

Once everything is up, head to http://localhost:16686 to see the trace viewing UI.  This project uses Jaeger without an intermediate collector as a simple way to quickly view metrics.  In a real environment you'd want to set up an otel collector.

#### Examine Traces
An easy way to test things out is to send a health check.

```bash
curl localhost:8085/health
```

That will show you what you get with the NGINX portion of the tracing.  You can follow the instructions in the main README or the blog post for more complex interactions but they won't differ too much in terms of the NGINX traces.



