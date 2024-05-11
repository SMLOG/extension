# Domain to check
domain="youtube.com"

# API endpoint to check block status
api_endpoint="http://127.0.0.1:3000/playtime"

# Check block status using API
response=$(curl -s "$api_endpoint?type=1")
blocked=$(echo "$response" | grep -o "pass")


if [[ "$blocked" != "true" ]]; then
    # Block the domain
    echo "127.0.0.1 $domain" |  tee -a /etc/hosts > /dev/null
    echo "127.0.0.1 www.${domain}" |  tee -a /etc/hosts > /dev/null
    echo "Domain has been blocked."
else
    # Unblock the domain
    sudo sed -i "/$domain/d" /etc/hosts
    echo "Domain has been unblocked."
fi