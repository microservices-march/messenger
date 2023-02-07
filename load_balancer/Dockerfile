FROM --platform=amd64 nginx:1.23.1

ARG CONSUL_TEMPLATE_VERSION=0.30.0
ARG OPENTELEMETRY_CPP_VERSION=1.0.3

# We define an environment variable with the location of our Consul cluster. By default, it will try to resolve to
# consul-client:8500 which would be the behavior if we have Consul running as a container in the same host and we link it to this
# NGINX container (with the alias consul, of course). But this environment variable can also be overridden when we run the
# container if we want to point somewhere else.
ENV CONSUL_URL consul-client:8500
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/opentelemetry-webserver-sdk/sdk_lib/lib

# Download the latest version of Consul Template and the OpenTelemetry C++ WebServer module
ADD https://releases.hashicorp.com/consul-template/${CONSUL_TEMPLATE_VERSION}/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip /tmp
ADD https://github.com/open-telemetry/opentelemetry-cpp-contrib/releases/download/webserver%2Fv${OPENTELEMETRY_CPP_VERSION}/opentelemetry-webserver-sdk-x64-linux.tgz /tmp

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init unzip \
  && unzip /tmp/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip -d /usr/local/bin \
  && rm -rf /tmp/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip \
  && tar xvfz /tmp/opentelemetry-webserver-sdk-x64-linux.tgz -C /opt \
  && rm -rf /tmp/opentelemetry-webserver-sdk-x64-linux.tgz \
  && /opt/opentelemetry-webserver-sdk/install.sh \
  && echo "load_module /opt/opentelemetry-webserver-sdk/WebServerModule/Nginx/1.23.1/ngx_http_opentelemetry_module.so;\n$(cat /etc/nginx/nginx.conf)" > /etc/nginx/nginx.conf

COPY consul-template-config.hcl ./consul-template-config.hcl
COPY nginx.ctmpl /usr/templates/nginx.ctmpl
COPY opentelemetry_module.conf /etc/nginx/conf.d/opentelemetry_module.conf

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["dumb-init", "consul-template", "-config=consul-template-config.hcl"]
