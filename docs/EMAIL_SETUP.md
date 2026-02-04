# Email Setup Guide

This guide explains how to configure email sending for the ISOTEC Photovoltaic Contract System.

## Overview

The system sends emails for:
1. **Verification codes** - 6-digit codes for contract signatures
2. **Signature confirmations** - Notifications when contracts are signed

## Development Mode

In development, emails are logged to the console instead of being sent. You'll see:

```
=== EMAIL SENT ===
To: contractor@example.com
Subject: Código de Verificação - ISOTEC
Code: 123456
==================
```

The verification code is also returned in the API response for testing.

## Production Setup

For production, you have four options:

### Option 1: Turbocloud SMTP (Recommended for Brazil)

[Turbocloud](https://turbocloud.com.br) is a Brazilian SMTP provider with excellent deliverability in Brazil.

**Pros:**
- Brazilian company with local support
- Optimized for Brazilian email providers
- Simple SMTP integration
- Competitive pricing
- No complex API - just SMTP

**Setup:**

1. Create account at https://turbocloud.com.br
2. Verify your domain
3. Get your SMTP credentials
4. Add environment variables to `.env.local`:

```bash
SMTP_HOST=smtp.turbocloud.com.br
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com.br
SMTP_FROM_NAME=ISOTEC
```

5. The system will automatically use SMTP in production when these variables are set

**How it works:**
- Development mode: Emails logged to console
- Production mode: Emails sent via SMTP using Nodemailer
- Automatic fallback to console if SMTP not configured

**Testing:**

```bash
# Start development server
npm run dev

# Create contract and test email flow
# Check console for email logs

# In production, actual emails will be sent via SMTP
```

**Pricing:**
- Contact Turbocloud for current pricing
- Typically charged per email sent
- Volume discounts available

### Option 2: Resend

[Resend](https://resend.com) is the easiest and most reliable option.

**Pros:**
- Simple API
- Generous free tier (100 emails/day)
- Excellent deliverability
- Built for developers

**Setup:**

1. Create account at https://resend.com
2. Verify your domain
3. Get your API key
4. Deploy Supabase Edge Function:

```bash
# Set secrets
supabase secrets set EMAIL_API_KEY=re_your_api_key
supabase secrets set EMAIL_FROM=noreply@yourdomain.com
supabase secrets set EMAIL_PROVIDER=resend

# Deploy function
supabase functions deploy send-email
```

5. Update `lib/services/email.ts` to use the Edge Function:

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to,
    subject: 'Código de Verificação - ISOTEC',
    html: getVerificationEmailTemplate(code, contractorName || ''),
  },
});
```

**Pricing:**
- Free: 100 emails/day, 3,000/month
- Pro: $20/month for 50,000 emails

### Option 3: SendGrid

[SendGrid](https://sendgrid.com) is a popular choice with more features.

**Pros:**
- Robust features (templates, analytics, etc.)
- Good free tier (100 emails/day)
- Widely used and trusted

**Setup:**

1. Create account at https://sendgrid.com
2. Verify your domain
3. Create API key with "Mail Send" permissions
4. Deploy Edge Function with SendGrid:

```bash
supabase secrets set EMAIL_API_KEY=SG.your_api_key
supabase secrets set EMAIL_FROM=noreply@yourdomain.com
supabase secrets set EMAIL_PROVIDER=sendgrid
supabase functions deploy send-email
```

**Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month for 50,000 emails

### Option 4: AWS SES

[AWS SES](https://aws.amazon.com/ses/) is the most cost-effective for high volume.

**Pros:**
- Very cheap ($0.10 per 1,000 emails)
- Highly scalable
- Integrates with AWS ecosystem

**Cons:**
- More complex setup
- Requires AWS account
- Sandbox mode requires verification

**Setup:**

1. Create AWS account
2. Set up SES in your region
3. Verify your domain
4. Request production access (to send to any email)
5. Create IAM user with SES permissions
6. Use AWS SDK in a custom Edge Function

**Pricing:**
- $0.10 per 1,000 emails
- No monthly fee

## Email Templates

The system includes two email templates:

### 1. Verification Code Email

Sent when a contractor requests to sign a contract.

**Features:**
- Large, easy-to-read code
- 15-minute expiration warning
- Security reminders
- ISOTEC branding

**Preview:**
```
⚡ ISOTEC
Soluções em Energia Solar

Código de Verificação

Olá, João Silva!

Use o código abaixo para assinar digitalmente seu contrato:

┌─────────────┐
│  1 2 3 4 5 6  │
└─────────────┘

⚠️ Importante:
• Este código expira em 15 minutos
• Não compartilhe este código
• Se não solicitou, ignore este email
```

### 2. Contract Signed Confirmation

Sent after successful signature.

**Features:**
- Success confirmation
- Link to view contract
- Next steps information
- ISOTEC branding

## Testing Emails

### Local Testing

1. Start development server:
```bash
npm run dev
```

2. Create a contract and request signature
3. Check console for verification code
4. Use code to complete signature
5. Check console for confirmation email

### Production Testing

1. Use a test email address you control
2. Request verification code
3. Check your inbox (and spam folder)
4. Verify the email looks correct
5. Complete signature and check confirmation email

## Troubleshooting

### Emails not being sent

**Check:**
1. Environment variables are set correctly
2. API key is valid and has correct permissions
3. Domain is verified with email provider
4. Edge Function is deployed successfully
5. Check Supabase logs: `supabase functions logs send-email`

### Emails going to spam

**Solutions:**
1. Verify your domain with SPF, DKIM, and DMARC records
2. Use a professional email address (not @gmail.com)
3. Warm up your domain by sending gradually increasing volumes
4. Avoid spam trigger words in subject/content
5. Include unsubscribe link (for marketing emails)

### Rate limiting issues

**Solutions:**
1. Implement exponential backoff for retries
2. Queue emails for batch sending
3. Upgrade to higher tier plan
4. Use multiple email providers for redundancy

## Environment Variables

Add these to your `.env.local` (development) and production environment:

### For SMTP (Turbocloud or any SMTP provider)

```bash
# SMTP Configuration
SMTP_HOST=smtp.turbocloud.com.br
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@isotec.com.br
SMTP_FROM_NAME=ISOTEC

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### For API-based services (Resend, SendGrid)

If you prefer to use Resend or SendGrid instead of SMTP, you'll need to modify `lib/services/email.ts` to use their APIs and set these variables:

```bash
# Email Service Configuration
EMAIL_SERVICE_PROVIDER=resend  # or 'sendgrid', 'ses'
EMAIL_API_KEY=your_api_key_here
EMAIL_FROM=noreply@isotec.com.br
EMAIL_FROM_NAME=ISOTEC

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Domain Verification

To send emails from your domain, you need to verify it:

### DNS Records Required

**SPF Record:**
```
TXT @ "v=spf1 include:_spf.resend.com ~all"
```

**DKIM Record:**
```
TXT resend._domainkey "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
```

**DMARC Record:**
```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

Your email provider will give you the exact records to add.

## Best Practices

1. **Always use verified domains** - Never send from @gmail.com or @yahoo.com
2. **Include unsubscribe links** - Even for transactional emails
3. **Monitor deliverability** - Check bounce and complaint rates
4. **Use templates** - Consistent branding and easier maintenance
5. **Test thoroughly** - Send test emails before going live
6. **Handle failures gracefully** - Don't fail the entire request if email fails
7. **Log email events** - Track sent, delivered, opened, clicked
8. **Respect rate limits** - Don't exceed provider limits
9. **Keep content clean** - Avoid spam trigger words
10. **Mobile-friendly** - Test on mobile devices

## Monitoring

Track these metrics:

- **Delivery rate** - % of emails successfully delivered
- **Open rate** - % of emails opened (if tracking enabled)
- **Bounce rate** - % of emails that bounced
- **Complaint rate** - % of emails marked as spam
- **Response time** - Time to send email

Most email providers offer dashboards with these metrics.

## Cost Estimation

Based on 1,000 contracts/month:

**Turbocloud:**
- 2,000 emails/month (verification + confirmation)
- Cost: Contact provider for pricing

**Resend:**
- 2,000 emails/month (verification + confirmation)
- Cost: Free (under 3,000/month)

**SendGrid:**
- 2,000 emails/month
- Cost: Free (under 3,000/month)

**AWS SES:**
- 2,000 emails/month
- Cost: $0.20/month

For higher volumes, calculate based on your provider's pricing.

## Support

If you need help:

1. Check provider documentation
2. Review Supabase Edge Function logs
3. Test with curl/Postman
4. Contact provider support
5. Check community forums

## Next Steps

1. Choose an email provider
2. Create account and verify domain
3. Deploy Edge Function
4. Test in development
5. Test in production with real emails
6. Monitor deliverability
7. Optimize based on metrics
