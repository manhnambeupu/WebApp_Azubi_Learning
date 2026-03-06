#!/bin/sh

set -eu

SSL_DIR="$(cd "$(dirname "$0")" && pwd)/ssl"
mkdir -p "$SSL_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/key.pem" \
  -out "$SSL_DIR/cert.pem" \
  -subj "/CN=localhost"

echo "Generated self-signed SSL certs at $SSL_DIR"
