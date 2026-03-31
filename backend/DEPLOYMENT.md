# Production Deployment Guide

## Pre-Deployment Checklist

### Security Configuration

- [ ] Generate strong `SESSION_SECRET` (32+ chars)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Set `ADMIN_PASSWORD_HASH` (scrypt hash, not plaintext)
  ```bash
  npm run hash-password "YourSecurePassword123!"
  ```

- [ ] Configure `CORS_ORIGIN` with your domains (NEVER leave blank!)
  ```bash
  CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
  ```

- [ ] Set `NODE_ENV=production`

- [ ] Configure SMTP (if email required)
  ```bash
  SMTP_HOST=smtp.sendgrid.net
  SMTP_USER=apikey
  SMTP_PASS=SG.xxxxxxxx
  SMTP_FROM=noreply@yourdomain.com
  ```

### Rate Limiting Configuration

Set appropriate limits based on your expected load:

```bash
# Default (adjust per your traffic)
RATE_LIMIT_GENERAL=100          # General API requests per minute
RATE_LIMIT_AUTH=10              # Login/register attempts per minute
RATE_LIMIT_LICENSE_SENSITIVE=20 # Trial/activation per minute
RATE_LIMIT_ADMIN_LOGIN=5        # Admin login attempts per minute
```

## Environment Variables - Full Reference

```bash
# Core
NODE_ENV=production
PORT=3001

# Security
SESSION_SECRET=<32+-char random string>
ADMIN_PASSWORD_HASH=<scrypt hash from hash-password>
ADMIN_EMAIL=admin@yourdomain.com

# CORS - REQUIRED
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Email (optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
SMTP_FROM=noreply@yourdomain.com

# Rate Limiting (tuned for production)
RATE_LIMIT_GENERAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_LICENSE_SENSITIVE=20
RATE_LIMIT_ADMIN_LOGIN=5

# Data Directory
DATA_DIR=/var/lib/sqlperf/data
```

## Deployment Steps

### 1. Build Application
```bash
npm ci                    # Install dependencies (lock file based)
npm run build            # Compile TypeScript
```

### 2. Set Environment Variables

#### Option A: .env File (NOT recommended for production)
```bash
# .env (DO NOT commit to git)
NODE_ENV=production
SESSION_SECRET=generated_secret_here
ADMIN_PASSWORD_HASH=hash_here
CORS_ORIGIN=https://yourdomain.com
# ... other vars
```

#### Option B: System Environment Variables (Recommended)
```bash
export NODE_ENV=production
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export ADMIN_PASSWORD_HASH=$(node dist/lib/password.js mypassword)
export CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

#### Option C: Docker / Container (Best Practice)
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY dist ./dist
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "dist/server.js"]
```

And pass environment variables:
```bash
docker run -e NODE_ENV=production \
  -e SESSION_SECRET=xxx \
  -e CORS_ORIGIN=https://yourdomain.com \
  -p 3001:3001 \
  sqlperf-backend:latest
```

### 3. Start Application

#### Development
```bash
npm run dev
```

#### Production
```bash
npm run build
npm run start
```

#### With Process Manager (PM2)
```bash
npm install -g pm2

pm2 start dist/server.js --name "sqlperf-backend" \
  --instances 2 \              # Use 2 CPU cores
  --max-memory-restart 500M \  # Restart if exceeds 500MB
  --env production

pm2 save
pm2 startup
```

## Reverse Proxy Configuration

### Nginx
```nginx
upstream sqlperf_backend {
  server localhost:3001;
  keepalive 32;
}

server {
  listen 443 ssl;
  server_name api.yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;

  location / {
    proxy_pass http://sqlperf_backend;
    proxy_http_version 1.1;
    
    # WebSocket support (if needed)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Important headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

### Apache
```apache
<VirtualHost *:443>
  ServerName api.yourdomain.com
  
  SSLEngine on
  SSLCertificateFile /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/api.yourdomain.com/privkey.pem
  
  # Security headers
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  
  ProxyPreserveHost On
  ProxyPass / http://localhost:3001/
  ProxyPassReverse / http://localhost:3001/
</VirtualHost>
```

## Database & Session Management

### Database Location
```bash
# Single file SQLite database
/var/lib/sqlperf/data/sqlperf.db

# Ensure proper permissions
chown sqlperf:sqlperf /var/lib/sqlperf/data
chmod 700 /var/lib/sqlperf/data
```

### Session Files
```bash
# Session storage
/var/lib/sqlperf/data/sessions/

# Cleanup old sessions (add to crontab)
0 0 * * * find /var/lib/sqlperf/data/sessions -mtime +30 -delete
```

## Monitoring & Health Checks

### Health Check Endpoint
```bash
# Simple health check
curl -s http://localhost:3001/health || exit 1
```

Add to systemd or Docker health check:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
```

### Log Monitoring
```bash
# View logs
pm2 logs sqlperf-backend

# Or with systemd
journalctl -u sqlperf-backend -f

# Or with Docker
docker logs -f container_name
```

### Key Metrics to Monitor
- Response times (avg, p95, p99)
- Rate limit hits (indicates abuse)
- Database query times
- CSRF token validation failures
- Failed login attempts
- Error rates

## Security Hardening

### 1. Firewall Rules
```bash
# Allow only HTTPS
ufw allow 443/tcp
ufw allow 80/tcp      # For Let's Encrypt renewal
ufw deny 3001/tcp     # Block direct access to backend
```

### 2. SSL/TLS Configuration
```bash
# Strong TLS 1.2+ only
# Use certbot for Let's Encrypt
sudo certbot certonly --nginx -d api.yourdomain.com
```

### 3. Regular Updates
```bash
# Keep dependencies updated
npm audit
npm update

# Rebuild and redeploy
npm run build
```

### 4. Backup Strategy
```bash
# Daily database backups
0 2 * * * tar -czf /backups/sqlperf-$(date +%Y%m%d).tar.gz /var/lib/sqlperf/data

# Retention: Keep 30 days
find /backups -mtime +30 -delete
```

## Troubleshooting

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Verify `CORS_ORIGIN` includes your frontend domain
```bash
# Restart with correct
CORS_ORIGIN=https://yourdomain.com npm run start
```

### CSRF Token Errors
```json
{"error": "CSRF token invalid"}
```
**Solution**: 
1. Ensure cookies are being sent (`credentials: 'include'`)
2. Token is refreshed properly
3. Session hasn't expired

### Rate Limit Exceeded
```json
{"message": "Too many requests"}
```
**Solution**:
1. Check `RATE_LIMIT_*` settings
2. Implement exponential backoff in client
3. Monitor for brute force attacks

### Database Lock (SQLite)
```
database is locked
```
**Solution**:
1. Check for long-running transactions
2. Increase `SQLITE_BUSY_TIMEOUT`
3. Consider migrating to PostgreSQL for high concurrency

## Rollback Procedure

```bash
# Keep previous version
cp -r dist dist.backup

# Rebuild if needed
git checkout previous-tag
npm ci
npm run build

# If needed, restore database from backup
tar -xzf /backups/sqlperf-YYYYMMDD.tar.gz -C /

# Restart
pm2 restart sqlperf-backend
# or
systemctl restart sqlperf-backend
```

## Performance Tuning

### Node.js Configuration
```bash
# Increase file descriptors
ulimit -n 65535

# Enable clustering
NODE_OPTIONS="--max-old-space-size=2048" npm run start
```

### Database Optimization
```bash
# Create indexes for common queries (check SECURITY.md)
sqlite3 sqlperf.db
> CREATE INDEX idx_customer_email ON Customers(email);
> CREATE INDEX idx_license_customer_id ON Licenses(customer_id);
```

### Caching Strategy
- Redis for session store (if high traffic)
- Browser caching for static assets
- CDN for public resources

