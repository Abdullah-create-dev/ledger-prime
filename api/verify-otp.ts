import crypto from 'crypto';

function verifyStatelessToken(email: string, code: string, token: string): boolean {
  if (!token) return false;
  try {
    const parts = token.split(':');
    if (parts.length !== 4) return false;
    
    const [tokenEmail, tokenCode, tokenExpiresAt, tokenSignature] = parts;
    
    // Check if email and code submitted match the token
    if (tokenEmail.toLowerCase() !== email.toLowerCase()) return false;
    if (tokenCode.trim() !== code.trim() && code.trim() !== '123456') return false; // Allow master code for testing
    
    // Check expiration
    const expiresAt = Number(tokenExpiresAt);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
    
    // Validate signature
    const SECRET_KEY = process.env.OTP_SECRET || 'ledgerprime-super-secret-otp-signing-key-value-2026';
    const data = `${tokenEmail}:${tokenCode}:${tokenExpiresAt}`;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
    
    return tokenSignature === expectedSignature;
  } catch (err) {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, code, token } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Both corporate e-mail and 6-digit code are mandatory parameters.' });
  }

  if (verifyStatelessToken(email, code, token)) {
    return res.json({ success: true, message: 'Double-entry security protocol verified!' });
  }

  return res.status(400).json({ error: 'Verification failed. The OTP code is invalid or has expired.' });
}
