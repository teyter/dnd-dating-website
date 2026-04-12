#!/bin/bash
# Here is our generateed self-signed SSL certificate for nginx
# we are using an EC certificate with the P-256 curve, which is more secure and efficient than RSA.
# we are not using RSA because it is less secure and more resource-intensive than EC certificates.
# The certificate is valid for 365 days and includes the IP address.
# We need to run this as root or with sudo on the server.

# Create SSL directory
mkdir -p /etc/nginx/ssl

# Generate self-signed EC certificate, P-256 curve
openssl req -x509 -nodes -days 365 -newkey ec \
  -pkeyopt ec_paramgen_curve:P-256 \
  -keyout /etc/nginx/ssl/selfsigned.key \
  -out /etc/nginx/ssl/selfsigned.crt \
  -subj "/CN=10.20.20.24" \
  -addext "subjectAltName=IP:10.20.20.24"

# Here we set proper permissions, so that only root can read the private key, and the certificate is readable by everyone.
chmod 600 /etc/nginx/ssl/selfsigned.key
chmod 644 /etc/nginx/ssl/selfsigned.crt

echo "Successfully generated a Self-signed EC certificate for nginx with the following details:"
echo "Certificate: /etc/nginx/ssl/selfsigned.crt"
echo "Key: /etc/nginx/ssl/selfsigned.key"
echo ""
echo "To enable HTTPS, we need to add this to our nginx config:"
echo "  ssl_certificate /etc/nginx/ssl/selfsigned.crt;"
echo "  ssl_certificate_key /etc/nginx/ssl/selfsigned.key;"
