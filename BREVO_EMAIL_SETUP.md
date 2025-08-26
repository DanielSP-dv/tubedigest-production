# Brevo Email Service Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create Brevo Account
1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Click "Start for free" and sign up with your email
3. Verify your email address

### 2. Get Your API Key
1. After login, go to [API Keys](https://app.brevo.com/settings/keys/api)
2. Click "Create a new API key"
3. Give it a name like "TubeDigest Production"
4. Select "Full access" permissions
5. Copy the API key (starts with `xkeysib-`)

### 3. Configure Your Environment
1. Copy `env-template.txt` to `.env`
2. Replace `your-brevo-api-key-here` with your actual API key:
   ```
   BREVO_API_KEY=xkeysib-your-actual-api-key-here...
   ```

### 4. Verify Domain (Optional but Recommended)
1. Go to [Senders & IP](https://app.brevo.com/settings/senders) in Brevo dashboard
2. Add your domain (e.g., `tubedigest.com`)
3. Follow the DNS verification steps
4. Update `SMTP_FROM` in your `.env`:
   ```
   SMTP_FROM=digest@yourdomain.com
   ```

## 📧 Free Tier Limits
- **300 emails per day** (9,000 emails/month)
- **Unlimited contacts**
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

## 🛠️ Configuration Options

### Option 1: Brevo API (Recommended)
- **Fastest**: Direct API calls
- **Most reliable**: 99.9% uptime
- **Best tracking**: Full analytics
- **Setup**: Just add `BREVO_API_KEY`

### Option 2: Brevo SMTP
- **Fallback**: If API fails
- **Compatible**: Works with existing SMTP code
- **Setup**: Use provided SMTP credentials

### Option 3: Resend Fallback
- **Backup**: If Brevo fails
- **Free tier**: 3,000 emails/month
- **Setup**: Add `RESEND_API_KEY`

## 📊 Monitoring

Check your email delivery in the Brevo dashboard:
- [Activity Log](https://app.brevo.com/reports/activity)
- [Analytics](https://app.brevo.com/reports/analytics)
- [Email Performance](https://app.brevo.com/reports/email-performance)

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API Key"**
   - Check that your API key starts with `xkeysib-`
   - Ensure no extra spaces in `.env` file
   - Verify API key has "Full access" permissions

2. **"Domain not verified"**
   - Use a verified domain or Brevo's default domain
   - Update `SMTP_FROM` to use a verified domain
   - Check sender verification in Brevo dashboard

3. **"Rate limit exceeded"**
   - Free tier: 300 emails/day
   - Check your usage in the dashboard
   - Consider upgrading plan if needed

### Debug Mode:
```bash
# Check environment variables
echo $BREVO_API_KEY

# Test API key directly
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: $BREVO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "test@example.com"}],
    "sender": {"email": "test@brevo.com", "name": "Test"},
    "subject": "Test",
    "htmlContent": "<p>Test email</p>"
  }'
```

## 🔄 Migration from Mailtrap

1. **Keep Mailtrap config** as fallback
2. **Add Brevo API key** to `.env`
3. **Test with Brevo** first
4. **Remove Mailtrap** once confirmed working

## 📈 Production Considerations

1. **Domain Verification**: Verify your domain for better deliverability
2. **SPF/DKIM**: Brevo handles this automatically
3. **Monitoring**: Set up webhooks for delivery tracking
4. **Rate Limits**: Monitor usage to avoid hitting limits
5. **Sender Reputation**: Build good sender reputation over time

## 🆘 Support

- **Brevo Docs**: [https://developers.brevo.com](https://developers.brevo.com)
- **Brevo Support**: [https://www.brevo.com/support](https://www.brevo.com/support)
- **API Reference**: [https://developers.brevo.com/reference](https://developers.brevo.com/reference)

## 🎯 Benefits of Brevo

- **✅ 300 emails/day** (vs Mailtrap's limit)
- **✅ Professional email delivery**
- **✅ Advanced analytics and tracking**
- **✅ Email templates and automation**
- **✅ Contact management**
- **✅ A/B testing capabilities**
- **✅ Webhook support**
- **✅ Multiple integration options**

## 🔧 Your Current Configuration

Based on your provided credentials:

```env
# Brevo API (Primary)
BREVO_API_KEY=your-api-key-here

# Brevo SMTP (Fallback)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=954bc2001@smtp-brevo.com
SMTP_PASS=ISpCVyLMGUJT1ctB
SMTP_FROM=digest@tubedigest.com
```

**Next Step**: Get your API key from [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api) and add it to your `.env` file!
