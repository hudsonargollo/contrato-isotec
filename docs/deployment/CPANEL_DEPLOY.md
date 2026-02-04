# Deploy Next.js to cPanel

## Prerequisites

- cPanel hosting with Node.js support (18+)
- SSH access
- Domain configured in cPanel
- Git installed on server

## Step 1: Prepare Your cPanel

1. **Enable Node.js Application**
   - Log into cPanel
   - Go to "Setup Node.js App"
   - Click "Create Application"
   - Set Node.js version: 18 or higher
   - Application root: `/home/username/contrato-isotec`
   - Application URL: your domain
   - Application startup file: `server.js`

## Step 2: Create Production Server File

Create `server.js` in your project root:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

## Step 3: Update package.json

Add production start script:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "lint": "next lint",
    "test": "jest"
  }
}
```

## Step 4: Deploy via SSH

```bash
# SSH into your server
ssh username@your-server.com

# Navigate to your home directory
cd ~

# Clone repository
git clone https://github.com/hudsonargollo/contrato-isotec.git
cd contrato-isotec

# Install dependencies
npm install

# Build the application
npm run build

# Set environment variables
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
SMTP_HOST=mail.clubemkt.digital
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nao-responda@clubemkt.digital
SMTP_PASS=Advance1773
SMTP_FROM=nao-responda@clubemkt.digital
SMTP_FROM_NAME=ISOTEC
NEXT_PUBLIC_APP_URL=https://your-domain.com
EOF
```

## Step 5: Configure Node.js App in cPanel

1. Go back to cPanel → "Setup Node.js App"
2. Click "Edit" on your application
3. Set environment variables (copy from .env.local)
4. Click "Save"
5. Click "Start App" or "Restart App"

## Step 6: Setup Reverse Proxy (if needed)

If your app runs on port 3000 but you want it on port 80/443:

1. In cPanel, go to "MultiPHP INI Editor" or ".htaccess"
2. Add reverse proxy rules:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## Step 7: Setup PM2 (Process Manager)

For better process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start npm --name "contrato-isotec" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Step 8: SSL Certificate

1. In cPanel, go to "SSL/TLS Status"
2. Enable AutoSSL or install Let's Encrypt certificate
3. Force HTTPS in .htaccess:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Updating Your Application

```bash
# SSH into server
ssh username@your-server.com
cd ~/contrato-isotec

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 restart contrato-isotec
# OR in cPanel: Setup Node.js App → Restart
```

## Troubleshooting

### App won't start
- Check Node.js version: `node --version` (must be 18+)
- Check logs in cPanel: Setup Node.js App → View Logs
- Check PM2 logs: `pm2 logs contrato-isotec`

### Port already in use
- Change PORT in environment variables
- Update reverse proxy configuration

### Database connection fails
- Verify Supabase credentials in environment variables
- Check firewall allows outbound connections

### SMTP not working
- Verify SMTP credentials
- Check if server allows outbound SMTP connections
- Test with: `telnet mail.clubemkt.digital 587`

## Performance Tips

1. **Enable caching** in .htaccess:
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

2. **Enable compression**:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

3. **Use PM2 cluster mode** for better performance:
```bash
pm2 start npm --name "contrato-isotec" -i max -- start
```

## Security

1. **Protect .env.local**:
```apache
<Files .env.local>
  Order allow,deny
  Deny from all
</Files>
```

2. **Disable directory listing**:
```apache
Options -Indexes
```

3. **Set proper file permissions**:
```bash
chmod 644 .env.local
chmod 755 server.js
```

## Support

If you encounter issues:
1. Check cPanel error logs
2. Check PM2 logs: `pm2 logs`
3. Check Next.js logs in `.next/` directory
4. Contact your hosting provider for Node.js support
