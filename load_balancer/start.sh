#!/bin/bash

nginx -g "daemon off;" && 
consul-template -config=consul-template-config.hcl