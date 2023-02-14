FROM --platform=amd64 nginx:1.23.1

# Replace the nginx.conf file with our own
COPY nginx.conf /etc/nginx/nginx.conf

# Define the version of the NGINX OpenTelemetry Module
ARG OPENTELEMETRY_CPP_VERSION=1.0.3

# Tell the system C library linker where to find the module (TODO: better explanation) 
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/opentelemetry-webserver-sdk/sdk_lib/lib

# 1. Download the latest version of Consul Template and the OpenTelemetry C++ WebServer module
ADD https://github.com/open-telemetry/opentelemetry-cpp-contrib/releases/download/webserver%2Fv${OPENTELEMETRY_CPP_VERSION}/opentelemetry-webserver-sdk-x64-linux.tgz /tmp

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init unzip \
  # 2. Extract the module files
  && tar xvfz /tmp/opentelemetry-webserver-sdk-x64-linux.tgz -C /opt \
  && rm -rf /tmp/opentelemetry-webserver-sdk-x64-linux.tgz \
  # 3. Install and add the `load_module` directive to the top of the main NGINX configuration file
  && /opt/opentelemetry-webserver-sdk/install.sh \
  && echo "load_module /opt/opentelemetry-webserver-sdk/WebServerModule/Nginx/1.23.1/ngx_http_opentelemetry_module.so;\n$(cat /etc/nginx/nginx.conf)" > /etc/nginx/nginx.conf

# 4. Copy in the configuration file for the NGINX OpenTelemetry module 
COPY opentelemetry_module.conf /etc/nginx/conf.d/opentelemetry_module.conf

EXPOSE 8085

STOPSIGNAL SIGQUIT
