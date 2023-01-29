FROM nginx:1.23
ARG    CONSUL_TEMPLATE_VERSION=0.30.0
# we define an environment variable with the location of our Consul cluster. By default, it will try to resolve to
# consul-client:8500 which would be the behavior if we have Consul running as a container in the same host and we link it to this
# Nginx container (with the alias consul, of course). But this environment variable can also be overridden when we run the
# container if we want to point somewhere else.
ENV 	 CONSUL_URL consul-client:8500

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init unzip;

# download the latest version of Consul Template and we put it on /usr/local/bin
ADD 	 https://releases.hashicorp.com/consul-template/${CONSUL_TEMPLATE_VERSION}/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip /usr/bin/
RUN 	 unzip /usr/bin/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip && \
    	 mv consul-template /usr/local/bin/consul-template && \
    	 rm -rf /usr/bin/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip

COPY nginx.ctmpl /usr/templates/nginx.ctmpl
COPY consul-template-config.hcl .

CMD ["dumb-init", "consul-template", "-config=consul-template-config.hcl"]
