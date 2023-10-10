ARG NGINX_VERSION=1.25.2
FROM nginx:${NGINX_VERSION}
ARG OPENTEL_MODULE_VERSION=0.1.0
# Replace the nginx.conf file with our own
COPY nginx.conf /etc/nginx/nginx.conf

# Download the NGINX source code for the configure script
ADD https://github.com/nginx/nginx/archive/refs/tags/release-${NGINX_VERSION}.tar.gz /tmp

ADD https://github.com/nginxinc/nginx-otel/archive/refs/tags/version-${OPENTEL_MODULE_VERSION}.tar.gz /tmp

RUN apt-get update -qq; \
    apt-get install --no-install-recommends -qqq --yes \
        cmake \
        build-essential \
        libssl-dev \
        zlib1g-dev \
        libpcre3-dev \
        pkg-config \
        libc-ares-dev \
        libre2-dev \
        unzip \
        git \
        curl \
    && mkdir /tmp/otel \
    && tar xvfz /tmp/version-${OPENTEL_MODULE_VERSION}.tar.gz -C /tmp/otel --strip-components=1 \
    && rm /tmp/version-${OPENTEL_MODULE_VERSION}.tar.gz \
    && mkdir /tmp/nginx \
    && tar xvfz /tmp/release-${NGINX_VERSION}.tar.gz -C /tmp/nginx --strip-components=1 \
    && rm /tmp/release-${NGINX_VERSION}.tar.gz \
    && cd /tmp/nginx \
    && auto/configure --with-compat \
    && cd /tmp/otel \
    && mkdir build \
    && cd build \
    && cmake -DNGX_OTEL_NGINX_BUILD_DIR=/tmp/nginx/objs ..\
    && cd /tmp/otel/build \
    && make \
    && cp ngx_otel_module.so /usr/lib/nginx/modules \
    && apt-get purge cmake curl git unzip build-essential pkg-config --yes --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf tmp


EXPOSE 8085

STOPSIGNAL SIGQUIT