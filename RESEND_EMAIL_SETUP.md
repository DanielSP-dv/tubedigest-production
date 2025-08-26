# Resend Email Service Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Click "Get Started" and sign up with your email
3. Verify your email address

### 2. Get Your API Key
1. After login, go to the [API Keys](https://resend.com/api-keys) page
2. Click "Create API Key"
3. Give it a name like "TubeDigest Production"
4. Copy the API key (starts with `re_`)

### 3. Configure Your Environment
1. Copy `env-template.txt` to `.env`
2. Replace `your-resend-api-key-here` with your actual API key:
   ```
   RESEND_API_KEY=re_1234567890abcdef...
   ```

### 4. Verify Domain (Optional but Recommended)
1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Add your domain (e.g., `tubedigest.com`)
3. Follow the DNS verification steps
4. Update `SMTP_FROM` in your `.env`:
   ```
   SMTP_FROM=digest@yourdomain.com
   ```

## 📧 Free Tier Limits
- **3,000 emails per month** (100 emails/day)
- **Unlimited domains**
- **99.9% uptime SLA**
- **No credit card required**

## 🔧 Testing the Setup

### Test Email Configuration
```bash
curl -X POST http://localhost:3001/digests/test-email
```

### Test Digest Sending
```bash
curl -X POST http://localhost:3001/digests/run
```

## 🛠️ Fallback Configuration

The system automatically falls back to SMTP if Resend fails:

1. **SMTP Fallback**: Uses your existing Mailtrap/SMTP config
2. **Gmail Fallback**: Uses Gmail SMTP if configured

## 📊 Monitoring

Check your email delivery in the Resend dashboard:
- [Activity Log](https://resend.com/activity)
- [Analytics](https://resend.com/analytics)

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API Key"**
   - Check that your API key starts with `re_`
   - Ensure no extra spaces in `.env` file

2. **"Domain not verified"**
   - Use a verified domain or Resend's default domain
   - Update `SMTP_FROM` to use a verified domain

3. **"Rate limit exceeded"**
   - Free tier: 100 emails/day
   - Check your usage in the dashboard

### Debug Mode:
```bash
# Check environment variables
echo $RESEND_API_KEY

# Test API key directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@resend.dev",
    "to": ["test@example.com"],
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

## 🔄 Migration from Mailtrap

1. **Keep Mailtrap config** as fallback
2. **Add Resend API key** to `.env`
3. **Test with Resend** first
4. **Remove Mailtrap** once confirmed working

## 📈 Production Considerations

1. **Domain Verification**: Verify your domain for better deliverability
2. **SPF/DKIM**: Resend handles this automatically
3. **Monitoring**: Set up webhooks for delivery tracking
4. **Rate Limits**: Monitor usage to avoid hitting limits

## 🆘 Support

- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Support**: [https://resend.com/support](https://resend.com/support)
- **API Reference**: [https://resend.com/docs/api-reference](https://resend.com/docs/api-reference)
