# SIRK VPS Deployment - Quick Start

**Fast track setup guide for experienced users**

---

## TL;DR

1. Create Digital Ocean droplet (Ubuntu 24.04, $16/month)
2. Install Node.js 20.x, nginx, git
3. Clone repo, build, configure nginx
4. Add GitHub secrets, push workflow file
5. Deploy via push to Main

**Time:** 30 minutes | **Difficulty:** Medium

---

## 1. VPS Setup (10 min)

```bash
# SSH into VPS as root
ssh root@YOUR_VPS_IP

# Install everything
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git

# Create user
adduser sirk
su - sirk

# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "sirk-deploy" -f ~/.ssh/sirk_deploy
cat ~/.ssh/sirk_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Clone and build
git clone https://github.com/RidgetopAi/sirk.git
cd sirk
npm install
npm run build
```

## 2. nginx Configuration (5 min)

```bash
# Exit to root
exit

# Create nginx config
cat > /etc/nginx/sites-available/sirk << 'EOF'
server {
    listen 80;
    server_name YOUR_VPS_IP;
    root /home/sirk/sirk/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable and restart
ln -s /etc/nginx/sites-available/sirk /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

**Test:** Visit `http://YOUR_VPS_IP`

## 3. GitHub Setup (5 min)

**Add secrets at:** https://github.com/RidgetopAi/sirk/settings/secrets/actions

- `VPS_HOST`: Your VPS IP address
- `VPS_USER`: `sirk`
- `VPS_SSH_KEY`: Contents of `/home/sirk/.ssh/sirk_deploy` (private key)

## 4. Deploy Workflow (1 min)

**On local machine:**
```bash
cd ~/aidis/projects/sirk

# Workflow file already created at .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "feat: Add VPS auto-deployment workflow"
git push origin Main
```

**Watch:** https://github.com/RidgetopAi/sirk/actions

## 5. Verification (1 min)

```bash
# Make a test change
echo "<!-- Deploy test $(date) -->" >> index.html
git add index.html
git commit -m "Test VPS deployment"
git push origin Main

# Wait 30 seconds, then visit:
# http://YOUR_VPS_IP
```

---

## Troubleshooting

**Build fails:** Check Node version: `node --version` (need 20.x)
**nginx 404:** Verify path: `ls /home/sirk/sirk/dist/index.html`
**SSH fails:** Test manually: `ssh sirk@YOUR_VPS_IP`
**Deployment not running:** Check GitHub Actions secrets

---

## Manual Deployment

If GitHub Actions fails:
```bash
./scripts/manual-deploy.sh YOUR_VPS_IP sirk
```

---

## What's Next?

**Optional improvements:**
- Add domain name (update nginx `server_name`)
- Enable HTTPS: `certbot --nginx -d yourdomain.com`
- Set up database backups (see `DATABASE_BACKUP_GUIDE.md`)
- Add monitoring (pm2, uptimerobot, etc.)

**For detailed explanation:** See `VPS_DEPLOYMENT_GUIDE.md`

---

**Done!** SIRK now auto-deploys on every push to Main 🚀
