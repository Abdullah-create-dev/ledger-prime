import dns from 'dns';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Disable DNS order limitations if supported
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

function createStatelessToken(email: string, code: string, expiresAt: number): string {
  const SECRET_KEY = process.env.OTP_SECRET || 'ledgerprime-super-secret-otp-signing-key-value-2026';
  const data = `${email.toLowerCase()}:${code}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  return `${email.toLowerCase()}:${code}:${expiresAt}:${signature}`;
}

export default async function handler(req: any, res: any) {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Corporate e-mail address is required.' });
  }

  const emailLower = email.toLowerCase();
  
  // 1. Reject local fallback / placeholder demo addresses
  if (
    emailLower.includes('@accounting.com') || 
    emailLower.includes('example.com') || 
    emailLower.includes('test.com') ||
    emailLower.includes('temp.com') ||
    emailLower === 'admin@accounting.com'
  ) {
    return res.status(400).json({ 
      error: 'Demo e-mail addresses (such as @accounting.com) are not supported for actual authentication. Please sign up or login with a real email address!' 
    });
  }

  // 2. Extract and verify domain exist in real life using MX records lookup
  const domain = emailLower.split('@')[1];
  if (!domain) {
    return res.status(400).json({ error: 'Invalid e-mail format.' });
  }

  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return res.status(400).json({ 
        error: `Verification failed: The domain '${domain}' has no active mail server (MX) records. Please use a real active email domain.` 
      });
    }
  } catch (dnsErr) {
    // If we're on a serverless network sandbox (like Vercel lambda sometimes blocking UDP/53 raw lookup), 
    // we bypass the MX record lookup for known giant domains like gmail, outlook, etc. so we never lock out the user.
    const trustedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'protonmail.com', 'live.com', 'msn.com'];
    if (!trustedDomains.includes(domain)) {
      return res.status(400).json({ 
        error: `Domain validation failed: Could not establish a secure lookup for '${domain}'. Please make sure the domain exists in real life and is capable of receiving mail.` 
      });
    }
    console.log(`[Vercel Serverless] Bypassed DNS MX record lookup error for trusted domain: ${domain}`);
  }

  // 3. Ensure SMTP variables are configured in the environment secrets or supplied in request payload
  const customSmtp = req.body.smtp_custom;
  const hasSmtpConfig = !!((process.env.SMTP_USER && process.env.SMTP_PASS) || (customSmtp && customSmtp.user && customSmtp.pass));
  
  const smtpHost = (customSmtp && customSmtp.host) || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number((customSmtp && customSmtp.port) || process.env.SMTP_PORT || 587);
  const smtpUser = (customSmtp && customSmtp.user) || process.env.SMTP_USER;
  const smtpPass = (customSmtp && customSmtp.pass) || process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    return res.status(400).json({
      error: `SMTP Service is currently unconfigured. Because you are using AI Studio Playground mode, you can expand the "Configure SMTP Service" tool at the bottom of the OTP panel to specify your own real email sending credentials (like Gmail App Passwords) directly in the UI! Stored locally in your browser only.`
    });
  }

  // Generate clean 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  console.log(`[LEDGERPRIME VERCEL SECURE] Dispatched actual 2FA code challenge to: ${emailLower} via host: ${smtpHost}`);

  try {
    // Initialize real mail transport client
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || customSmtp?.from || `"LedgerPrime Security" <no-reply@ledgerprime.com>`,
      to: emailLower,
      subject: '🔐 Secure 2-Step Verification - LedgerPrime HQ',
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; background-color: #0F0F10; color: #E4E4E7; padding: 40px 20px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #27272A;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">LedgerPrime HQ</h1>
            <p style="color: #71717A; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Enterprise Bookkeeping Suite</p>
          </div>
          
          <div style="background-color: #161618; border: 1px solid #27272A; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px;">
            <p style="color: #A1A1AA; font-size: 13px; margin-top: 0;">Your secure, single-use 2-Step Verification Code:</p>
            <div style="background-color: #0F0F10; border: 1px solid #3F3F46; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 6px; display: inline-block; margin: 15px 0;">
              ${code}
            </div>
            <p style="color: #71717A; font-size: 11px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this message.</p>
          </div>
          
          <div style="border-top: 1px solid #27272A; padding-top: 20px; text-align: center; font-size: 10px; color: #71717A;">
            <span>Official ledger encryption notice. Transmission secure.</span>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[LEDGERPRIME VERCEL SECURE] SMTP email dispatch succeeded for ${emailLower}!`);

    const token = createStatelessToken(emailLower, code, expiresAt);

    return res.json({
      success: true,
      emailSent: true,
      emailRecipient: emailLower,
      token,
      message: 'A real secure verification PIN has been dispatched to your email inbox.',
    });
  } catch (mailError: any) {
    console.error('[LEDGERPRIME VERCEL SECURE] SMTP Transmission Failure:', mailError);
    return res.status(500).json({
      error: `Failed to dispatch real email verification PIN to '${emailLower}': ${mailError.message || mailError}. Please confirm your SMTP credentials and network layout.`
    });
  }
}
