consul {
  address = "consul-client:8500"

  retry {
    enabled  = true
    attempts = 12
    backoff  = "250ms"
  }
}
template {
  source      = "/usr/templates/nginx.ctmpl"
  destination = "/etc/nginx/conf.d/default.conf"
  perms       = 0600
  command     = "if [ -e /var/run/nginx.pid ]; then nginx -s reload; else nginx; fi"
}
