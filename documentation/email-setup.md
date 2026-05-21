# Email Setup — ShiftEasy

## Service: Brevo (formerly Sendinblue)
Free tier: 300 emails/day. No domain required, just sender email verification.
Account: ruslan.temirov1995@gmail.com

## Why not Gmail / nodemailer SMTP?
Render's free tier blocks outbound SMTP connections (ports 465/587).
Nodemailer with Gmail works on localhost but times out on Render with `ETIMEDOUT CONN`.

## Why not Resend?
Resend's `onboarding@resend.dev` test sender can only send to the account's own email.
Sending to arbitrary worker emails is silently dropped on the free plan without a verified domain.

## Current setup

**Sender email:** `rururuhan995@gmail.com` — verified in Brevo → Settings → Senders, Domains, IPs
**API key env var:** `BREVO_API_KEY` — set in Render environment variables
**Package:** `@getbrevo/brevo` (v5)
**File:** `server/src/utils/email.utils.ts`

### How it works
```
Manager adds worker
  → backend creates user in DB
  → generates invite token (valid 30 days)
  → calls sendInviteEmail() — fire-and-forget (does not block response)
  → Brevo HTTP API sends email to worker
  → worker clicks "Activate account" link → sets password
```

### Invite token expiry
- Set in `server/src/controllers/worker.controller.ts`
- Both on worker creation and resend invite: `Date.now() + 30 * 24 * 60 * 60 * 1000` (30 days)

### Email types
1. **Invite email** — sent when manager adds a new worker or resends invite
2. **Password reset email** — sent when user clicks "Forgot password"

## If email stops working

1. Check Render logs for `Invite email failed:` lines
2. Verify `BREVO_API_KEY` is set in Render → Environment
3. Check Brevo dashboard → Logs → Transactional to see if emails are being sent/bounced
4. Make sure `rururuhan995@gmail.com` is still Verified in Brevo → Senders

## Brevo account
- Login: ruslan.temirov1995@gmail.com
- Dashboard: app.brevo.com
