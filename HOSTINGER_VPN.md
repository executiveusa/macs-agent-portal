# Hostinger VPN Configuration for Coolify Access

This document provides detailed instructions for setting up Hostinger VPN tunnel to access a self-hosted Coolify instance.

## Overview

Hostinger VPN enables secure access to a Coolify deployment running on a private network or behind NAT. This is particularly useful when:

- Coolify is self-hosted on a home server
- The server doesn't have a static public IP
- Additional security layer is required
- Cost optimization (self-hosting vs cloud)

## Architecture

```
┌─────────────────┐      VPN Tunnel       ┌─────────────────┐
│  Local Machine  │ ◄──────────────────► │ Hostinger VPS   │
│  (Developer)    │    WireGuard/OpenVPN  │   (VPN Server)  │
└─────────────────┘                        └────────┬────────┘
                                                    │
                                                    │ Port Forward
                                                    │
                                          ┌─────────▼────────┐
                                          │  Coolify Server  │
                                          │  (Self-hosted)   │
                                          └──────────────────┘
```

## Prerequisites

- **Hostinger VPS**: Active VPS hosting plan
- **SSH Access**: Root or sudo access to Hostinger VPS
- **Coolify Server**: Running Coolify instance (on-premises or cloud)
- **VPN Client**: WireGuard or OpenVPN client installed locally

## Setup Methods

### Option 1: WireGuard VPN (Recommended)

WireGuard is faster, more secure, and easier to configure than traditional VPN protocols.

#### Step 1: Install WireGuard on Hostinger VPS

```bash
# Connect to Hostinger VPS via SSH
ssh root@your-hostinger-vps.com

# Update system
apt update && apt upgrade -y

# Install WireGuard
apt install wireguard -y

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p
```

#### Step 2: Generate WireGuard Keys

```bash
# On Hostinger VPS
cd /etc/wireguard

# Generate server keys
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key

# Generate client keys (for your local machine)
wg genkey | tee client_private.key | wg pubkey > client_public.key

# Display keys (save these securely)
echo "Server Private Key:" && cat server_private.key
echo "Server Public Key:" && cat server_public.key
echo "Client Private Key:" && cat client_private.key
echo "Client Public Key:" && cat client_public.key
```

#### Step 3: Configure WireGuard Server on Hostinger VPS

```bash
# Create WireGuard config
cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Local machine (developer)
PublicKey = <CLIENT_PUBLIC_KEY>
AllowedIPs = 10.200.200.2/32
EOF

# Replace placeholders with actual keys
# Edit the file: nano /etc/wireguard/wg0.conf

# Set correct permissions
chmod 600 /etc/wireguard/wg0.conf

# Enable and start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Check status
systemctl status wg-quick@wg0
wg show
```

#### Step 4: Configure Firewall on Hostinger VPS

```bash
# Allow WireGuard port
ufw allow 51820/udp

# Allow SSH (important!)
ufw allow 22/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

#### Step 5: Configure WireGuard Client (Local Machine)

**On Linux/macOS:**

```bash
# Install WireGuard
# Ubuntu/Debian: apt install wireguard
# macOS: brew install wireguard-tools

# Create client config
sudo mkdir -p /etc/wireguard
sudo nano /etc/wireguard/wg0-client.conf
```

Add the following content:

```ini
[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY>
Address = 10.200.200.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = your-hostinger-vps.com:51820
AllowedIPs = 10.200.200.0/24
PersistentKeepalive = 25
```

**On Windows:**

1. Download WireGuard from https://www.wireguard.com/install/
2. Install and open WireGuard GUI
3. Click "Add Tunnel" → "Add empty tunnel"
4. Paste the client configuration above
5. Click "Activate"

#### Step 6: Connect to VPN

**Linux/macOS:**
```bash
sudo wg-quick up wg0-client

# Test connection
ping 10.200.200.1

# Disconnect
sudo wg-quick down wg0-client
```

**Windows:**
- Click "Activate" in WireGuard GUI

### Option 2: OpenVPN (Alternative)

If WireGuard is not available, use OpenVPN.

#### Install OpenVPN on Hostinger VPS

```bash
# Use openvpn-install script
wget https://git.io/vpn -O openvpn-install.sh
chmod +x openvpn-install.sh
sudo ./openvpn-install.sh

# Follow prompts to:
# - Choose default settings
# - Create client certificate
# - Download .ovpn file
```

#### Connect with OpenVPN Client

```bash
# Linux/macOS
sudo openvpn --config client.ovpn

# Windows: Use OpenVPN GUI
```

## Port Forwarding to Coolify Server

Once VPN is established, configure port forwarding from Hostinger VPS to Coolify server.

### Method 1: SSH Tunneling (Simple)

```bash
# On local machine (after VPN is connected)
ssh -L 8000:coolify-server-ip:8000 root@10.200.200.1

# Access Coolify at:
# http://localhost:8000
```

### Method 2: Nginx Reverse Proxy (Production)

Configure Nginx on Hostinger VPS to proxy to Coolify:

```bash
# On Hostinger VPS
apt install nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/coolify << 'EOF'
server {
    listen 80;
    server_name coolify.yourdomain.com;

    location / {
        proxy_pass http://COOLIFY_SERVER_IP:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/coolify /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install SSL certificate
apt install certbot python3-certbot-nginx -y
certbot --nginx -d coolify.yourdomain.com
```

### Method 3: iptables Port Forwarding (Advanced)

```bash
# On Hostinger VPS
# Forward port 8000 to Coolify server
iptables -t nat -A PREROUTING -p tcp --dport 8000 -j DNAT --to-destination COOLIFY_SERVER_IP:8000
iptables -t nat -A POSTROUTING -j MASQUERADE

# Save rules
iptables-save > /etc/iptables/rules.v4

# Access Coolify at:
# http://your-hostinger-vps.com:8000
```

## DNS Configuration

### Option 1: Subdomain Pointing to Hostinger VPS

```
Type: A
Name: coolify
Value: <Hostinger VPS IP>
TTL: 300
```

### Option 2: Cloudflare Tunnel (Zero-Trust)

For enhanced security, use Cloudflare Tunnel:

```bash
# On Hostinger VPS
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create coolify-tunnel

# Route traffic
cloudflared tunnel route dns coolify-tunnel coolify.yourdomain.com

# Run tunnel
cloudflared tunnel run coolify-tunnel --url http://COOLIFY_SERVER_IP:8000
```

## Security Hardening

### 1. Firewall Rules

```bash
# On Hostinger VPS
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 51820/udp # WireGuard
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 2. SSH Key Authentication

```bash
# Disable password authentication
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 3. Fail2Ban

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. VPN Access Control

```bash
# Limit WireGuard to specific IPs (if needed)
# Edit /etc/wireguard/wg0.conf
# Only add trusted client public keys
```

## Testing the Connection

### Test VPN Connectivity

```bash
# From local machine (after connecting to VPN)
ping 10.200.200.1  # Ping Hostinger VPS
ping COOLIFY_SERVER_IP  # Ping Coolify server
```

### Test Coolify Access

```bash
# Via browser
# http://coolify.yourdomain.com
# or
# http://your-hostinger-vps.com:8000

# Via curl
curl http://10.200.200.1:8000
```

### Test Port Forwarding

```bash
# On local machine
telnet your-hostinger-vps.com 8000
# Should connect to Coolify server
```

## Troubleshooting

### VPN Won't Connect

**Check server status:**
```bash
# On Hostinger VPS
systemctl status wg-quick@wg0
journalctl -u wg-quick@wg0 -n 50
```

**Check firewall:**
```bash
ufw status
# Ensure port 51820/udp is allowed
```

**Check endpoint:**
```bash
# Verify Hostinger VPS IP is correct
nslookup your-hostinger-vps.com
```

### Can't Access Coolify

**Check Coolify is running:**
```bash
# On Coolify server
docker ps | grep coolify
```

**Check port forwarding:**
```bash
# On Hostinger VPS
iptables -t nat -L -n -v
```

**Check network connectivity:**
```bash
# From Hostinger VPS
curl http://COOLIFY_SERVER_IP:8000
```

### Slow Performance

**Enable compression:**
```bash
# Add to WireGuard config
# /etc/wireguard/wg0.conf
MTU = 1420
```

**Optimize routing:**
```bash
# Only route Coolify traffic through VPN
# AllowedIPs = 10.200.200.0/24 (not 0.0.0.0/0)
```

## Monitoring

### Monitor VPN Connection

```bash
# On Hostinger VPS
watch -n 1 wg show

# Check bandwidth
iftop -i wg0
```

### Monitor Coolify Access

```bash
# Nginx access logs
tail -f /var/log/nginx/access.log | grep coolify
```

## Cost Optimization

### Hostinger VPS Pricing

- **KVM 1**: $3.99/month (1 vCPU, 4GB RAM) - Suitable for VPN gateway
- **KVM 2**: $8.99/month (2 vCPU, 8GB RAM) - Can host Coolify too
- **KVM 4**: $18.99/month (4 vCPU, 16GB RAM) - Production ready

### Comparison with Cloud Alternatives

| Provider | Monthly Cost | Notes |
|----------|--------------|-------|
| Hostinger VPS | $3.99-$18.99 | VPN + optional Coolify |
| Railway Free | $0 (limited) | Good for small projects |
| DigitalOcean | $6-$24 | Direct Coolify hosting |
| AWS Lightsail | $5-$40 | Direct Coolify hosting |

**Best Practice**: Use Railway free tier → Hostinger VPN + Coolify → Cloud provider (as scale increases)

## Automation Scripts

### Auto-reconnect Script (Local Machine)

```bash
#!/bin/bash
# save as: ~/bin/coolify-vpn-monitor.sh

VPN_INTERFACE="wg0-client"
CHECK_HOST="10.200.200.1"

while true; do
  if ! ping -c 1 -W 2 $CHECK_HOST > /dev/null 2>&1; then
    echo "VPN down, reconnecting..."
    sudo wg-quick down $VPN_INTERFACE 2>/dev/null
    sleep 2
    sudo wg-quick up $VPN_INTERFACE
  fi
  sleep 30
done
```

### Health Check Script (Hostinger VPS)

```bash
#!/bin/bash
# save as: /root/coolify-health-check.sh

COOLIFY_IP="COOLIFY_SERVER_IP"
COOLIFY_PORT="8000"

if ! curl -s http://$COOLIFY_IP:$COOLIFY_PORT > /dev/null; then
  echo "Coolify health check failed!"
  # Send alert (email, Slack, etc.)
fi
```

## Documentation for Team

### Connection Instructions for Developers

1. **Install WireGuard client**
2. **Request client config** from admin
3. **Import config** into WireGuard
4. **Activate connection**
5. **Access Coolify** at http://coolify.yourdomain.com

### Sharing Access

```bash
# On Hostinger VPS
# Generate new client config
cd /etc/wireguard
wg genkey | tee client2_private.key | wg pubkey > client2_public.key

# Add to /etc/wireguard/wg0.conf
[Peer]
PublicKey = <CLIENT2_PUBLIC_KEY>
AllowedIPs = 10.200.200.3/32

# Restart WireGuard
systemctl restart wg-quick@wg0
```

## Backup and Disaster Recovery

### Backup VPN Configuration

```bash
# On Hostinger VPS
tar -czf wireguard-backup.tar.gz /etc/wireguard/
scp wireguard-backup.tar.gz user@backup-server:/backups/
```

### Restore from Backup

```bash
# On new Hostinger VPS
tar -xzf wireguard-backup.tar.gz -C /
systemctl restart wg-quick@wg0
```

## Next Steps

- [ ] Set up Hostinger VPS
- [ ] Install and configure WireGuard
- [ ] Test VPN connection
- [ ] Configure port forwarding to Coolify
- [ ] Set up DNS/domain
- [ ] Enable SSL certificates
- [ ] Configure monitoring
- [ ] Document for team
- [ ] Test failover from Railway

---

**Status**: Configuration ready, not activated  
**Cost**: $3.99-$18.99/month (Hostinger VPS)  
**Activation**: Manual (when Railway free tier exceeded)  
**Last Updated**: 2025-12-06
