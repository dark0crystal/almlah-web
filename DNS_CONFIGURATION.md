# DNS Configuration for almlah.com

## Required DNS Records

Add these DNS records in your domain registrar (Namecheap, GoDaddy, etc.):

### For Backend (API)
```
Type: CNAME
Name: api
Value: almlah-backend.onrender.com
TTL: 300
```

### For Frontend (Main Website)
You have two options:

#### Option 1: Using Vercel (Recommended)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300

Type: A
Name: @
Value: 76.76.19.61
TTL: 300
```

#### Option 2: Using Render for both frontend and backend
```
Type: CNAME
Name: www
Value: almlah-frontend.onrender.com
TTL: 300

Type: A
Name: @
Value: [Render's IP - will be provided after deployment]
TTL: 300
```

## Step-by-Step DNS Setup

### 1. Access Your Domain Registrar
- Log into your domain registrar (where you bought almlah.com)
- Navigate to DNS management/DNS records

### 2. Add Backend DNS Record
- Type: `CNAME`
- Host/Name: `api`
- Points to/Value: `almlah-backend.onrender.com`
- TTL: `300` (5 minutes)

### 3. Add Frontend DNS Records (if using Vercel)
- **Root domain record:**
  - Type: `A`
  - Host/Name: `@` or leave empty
  - Points to/Value: `76.76.19.61`
  - TTL: `300`

- **WWW subdomain record:**
  - Type: `CNAME` 
  - Host/Name: `www`
  - Points to/Value: `cname.vercel-dns.com`
  - TTL: `300`

### 4. Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours to propagate
- Use tools like `dig` or online DNS checkers to verify

## Verification Commands

### Check API subdomain
```bash
dig api.almlah.com
nslookup api.almlah.com
```

### Check main domain
```bash
dig almlah.com
nslookup almlah.com
```

## SSL Certificates
- Render automatically provides SSL certificates for custom domains
- Vercel also provides automatic SSL
- Your sites will be available at:
  - `https://almlah.com` (frontend)
  - `https://api.almlah.com` (backend)

## Common Issues & Solutions

### Issue: "Domain not verified"
**Solution:** Ensure DNS records are correct and wait for propagation

### Issue: SSL certificate not working
**Solution:** Wait 24 hours after DNS setup for automatic SSL provisioning

### Issue: "This site can't be reached"
**Solution:** Verify DNS records and check if services are deployed successfully

## After DNS Setup
1. ✅ Update Render service to use custom domain
2. ✅ Update frontend environment variables
3. ✅ Update Google OAuth redirect URLs
4. ✅ Test all endpoints with new domain