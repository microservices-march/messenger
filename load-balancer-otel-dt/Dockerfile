FROM --platform=amd64 nginx:1.23.3

ARG CONSUL_TEMPLATE_VERSION=0.30.0

# We define an environment variable with the location of our Consul cluster. By default, it will try to resolve to
# consul-client:8500 which would be the behavior if we have Consul running as a container in the same host and we link it to this
# NGINX container (with the alias consul, of course). But this environment variable can also be overridden when we run the
# container if we want to point somewhere else.
ENV CONSUL_URL consul-client:8500

# Download the latest version of Consul Template and the OpenTelemetry module
ADD https://releases.hashicorp.com/consul-template/${CONSUL_TEMPLATE_VERSION}/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip /tmp
COPY otel_ngx_module.so /etc/nginx/modules

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init unzip \
  && unzip /tmp/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip -d /usr/local/bin \
  && rm -rf /tmp/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip \
  && echo "load_module modules/otel_ngx_module.so;\n$(cat /etc/nginx/nginx.conf)" > /etc/nginx/nginx.conf \
  && sed -i '/^http {/a\    opentelemetry_config /etc/nginx/conf.d/otel-nginx.toml;' /etc/nginx/nginx.conf

COPY consul-template-config.hcl ./consul-template-config.hcl
COPY nginx.ctmpl /usr/templates/nginx.ctmpl
COPY otel-nginx.toml /etc/nginx/conf.d/otel-nginx.toml

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["dumb-init", "consul-template", "-config=consul-template-config.hcl"]
