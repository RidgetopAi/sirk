# VPS Deployment Guide for SIRK

**Goal:** Deploy SIRK to Digital Ocean VPS with GitHub Actions auto-deployment

**Timeline:** 30-45 minutes for complete setup

---

## Prerequisites

- [ ] Digital Ocean account created
- [ ] $16/month droplet purchased (2GB RAM, 1 vCPU, 70GB SSD)
- [ ] SSH access to VPS configured
- [ ] GitHub repo access: git@github.com:RidgetopAi/sirk.git

---

## Phase 1: Initial VPS Setup (15 minutes)

### Step 1: Create Digital Ocean Droplet

1. **Log into Digital Ocean**
2. **Create Droplet:**
   - **Image:** Ubuntu 24.04 LTS x64
   - **Plan:** Basic $16/month (2GB RAM, 1 vCPU, 70GB SSD, 2TB transfer)
   - **Datacenter:** Choose closest region (e.g., New York, San Francisco)
   - **Authentication:** SSH keys (recommended) or Password
   - **Hostname:** sirk-production (or your preference)

3. **Note your IP address:** `XXX.XXX.XXX.XXX` (you'll need this!)

### Step 2: Initial Server Configuration

SSH into your VPS:

```bash
ssh root@YOUR_VPS_IP
```

**Update system:**

```bash
apt update && apt upgrade -y
```

**Install required software:**

```bash
# Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# nginx (web server)
apt install -y nginx

# Git
apt install -y git

# Verify installations
node --version  # Should show v20.x
npm --version   # Should show 10.x
nginx -v        # Should show nginx/1.24+
```

### Step 3: Create Deployment User

**Create dedicated user for deployments (security best practice):**

```bash
# Create user
adduser sirk
# Follow prompts, set a password

# Add to sudo group (optional, not required for deployment)
usermod -aG sudo sirk

# Switch to sirk user
su - sirk
```

### Step 4: Set Up SSH Keys for GitHub Actions

**On VPS (as sirk user):**

```bash
# Generate SSH key for deployment
ssh-keygen -t ed25519 -C "sirk-deployment" -f ~/.ssh/sirk_deploy
# Press Enter for no passphrase (required for automation)

# Display private key (copy this - you'll add to GitHub Secrets)
cat ~/.ssh/sirk_deploy

# Display public key (copy this - you'll add to authorized_keys)
cat ~/.ssh/sirk_deploy.pub

# Add public key to authorized_keys
cat ~/.ssh/sirk_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Save these for later:**

- Private key (`~/.ssh/sirk_deploy`) → Goes to GitHub Secrets as `VPS_SSH_KEY`
- VPS IP address → Goes to GitHub Secrets as `VPS_HOST`
- Username: `sirk` → Goes to GitHub Secrets as `VPS_USER`

---

## Phase 2: Application Setup (10 minutes)

### Step 5: Clone Repository

**On VPS (as sirk user):**

```bash
# Navigate to home directory
cd ~

# Clone SIRK repository
git clone https://github.com/RidgetopAi/sirk.git
cd sirk

# Install dependencies
npm install

# Build production bundle
npm run build
```

**Verify build:**

```bash
ls -lh dist/  # Should see index.html, assets/, etc.
```

### Step 6: Configure nginx

**On VPS (as root, exit sirk user first):**

```bash
# Exit sirk user
exit

# Create nginx configuration
nano /etc/nginx/sites-available/sirk
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name YOUR_VPS_IP;  # Replace with actual IP or domain later

    root /home/sirk/sirk/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site and restart nginx:**

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/sirk /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx
```

**Test in browser:**

```
http://YOUR_VPS_IP
```

You should see the SIRK dashboard!

---

## Phase 3: GitHub Actions Setup (10 minutes)

### Step 7: Add GitHub Secrets

1. **Go to GitHub repository:** https://github.com/RidgetopAi/sirk
2. **Settings → Secrets and variables → Actions**
3. **Add these secrets:**
   - **Name:** `VPS_HOST`
     **Value:** Your VPS IP address (e.g., `165.227.123.45`)

   - **Name:** `VPS_USER`
     **Value:** `sirk`

   - **Name:** `VPS_SSH_KEY`
     **Value:** Private key from `/home/sirk/.ssh/sirk_deploy` (entire contents, including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### Step 8: Create GitHub Actions Workflow

**On your local machine:**

The workflow file will be created at:

```
projects/sirk/.github/workflows/deploy.yml
```

This workflow will:

1. Trigger on push to Main branch
2. SSH into VPS
3. Pull latest code
4. Install dependencies
5. Build production bundle
6. Restart nginx (if needed)

---

## Phase 4: Verification (5 minutes)

### Step 9: Test Auto-Deployment

**On your local machine:**

```bash
cd ~/aidis/projects/sirk

# Make a small change to verify deployment
echo "<!-- Deployment test $(date) -->" >> index.html

# Commit and push
git add index.html
git commit -m "Test: Verify VPS auto-deployment"
git push origin Main
```

**Watch GitHub Actions:**

1. Go to: https://github.com/RidgetopAi/sirk/actions
2. You should see workflow running
3. Wait for green checkmark (~30 seconds)

**Verify in browser:**

```
http://YOUR_VPS_IP
```

Hard refresh (Ctrl+Shift+R) and verify your change is live!

---

## Phase 5: Update SIRK Documentation

### Step 10: Update Deployment URL

**Update these files:**

1. **README.md** - Change deployment URL to `http://YOUR_VPS_IP`
2. **HANDOFF.md** - Update deployment instructions
3. **Commit changes:**
   ```bash
   git add README.md HANDOFF.md
   git commit -m "docs: Update deployment URL to VPS"
   git push origin Main
   ```

-─--

## Troubleshooting

### Deployment fails with SSH error

- Verify `VPS_SSH_KEY` secret contains the entire private key
- Check `VPS_HOST` and `VPS_USER` are correct
- Test manual SSH: `ssh -i ~/.ssh/sirk_deploy sirk@YOUR_VPS_IP`

### nginx shows 404

- Check `dist/` folder exists: `ls /home/sirk/sirk/dist/`
- Verify nginx config: `nginx -t`
- Check nginx logs: `tail -f /var/log/nginx/error.log`

### Build fails on VPS

- Check disk space: `df -h`
- Check Node version: `node --version` (should be 20.x)
- Manual build: `cd /home/sirk/sirk && npm run build`

### Site doesn't update after push

- Check GitHub Actions status
- SSH into VPS and check git log: `cd /home/sirk/sirk && git log -1`
- Manual pull: `cd /home/sirk/sirk && git pull origin Main && npm run build`

---

## Next Steps (Optional)

### Add HTTPS (Free with Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### Add Database Backups

See `DATABASE_BACKUP_GUIDE.md` (to be created)

### Monitor with Status Page

Install pm2 or similar for process monitoring

---

## Summary

**What you now have:**

- ✅ SIRK deployed to VPS at `http://YOUR_VPS_IP`
- ✅ Auto-deployment on every push to Main branch
- ✅ Production-grade nginx serving static files
- ✅ ~69GB free space for future use
- ✅ Platform for database backups (future)

**Cost:**

- VPS: $16/month (flat rate, no overages)
- Domain: $0 (using IP) or ~$12/year (optional)
- **Total: $16/month vs $20-30/month on Netlify**

**Next experiment instances:**

- Push to Main branch → site updates automatically in 30 seconds
- No build credits consumed
- No Netlify limitations
- Full control over infrastructure

---

**Setup Complete!** 🎉

Your VPS is now ready for the SIRK experiment.
