const crypto = require('crypto');

/**
 * Validates the "v" signature parameter used by MobileListener's callers
 * (mobile app / Karix integration) - an AES-256-CBC encrypted timestamp
 * that must be within the last 15 minutes.
 *
 * SECURITY NOTE - read before deploying:
 * The old ASP.NET code (MobileListener.aspx.cs, mValid()) had a hardcoded
 * bypass: `if (v == "gurpreet") { r.sts = true; return r; }` - literally a
 * magic string that skipped ALL signature validation. Anyone who knew or
 * guessed that string could call every method on this endpoint (including
 * the "insert complaint" and "close complaint" ones) with zero
 * authentication. This is a real, currently-active vulnerability in the
 * production app you shared with me, independent of this rewrite - worth
 * escalating and patching (or at minimum, removing that one line) even if
 * this Node rewrite isn't deployed yet.
 *
 * This replacement deliberately has no such bypass. It also moves the
 * AES key/IV out of source code and into environment variables - they
 * were previously hardcoded byte arrays directly in the .cs file, visible
 * to anyone with repo access.
 */
function validateSignature(v) {
  if (!v) return { valid: false, message: 'Missing signature' };

  try {
    const key = Buffer.from(JSON.parse(process.env.MOBILE_AUTH_KEY)); // 16 bytes -> AES-128, matches old RijndaelManaged KeySize/BlockSize config
    const iv = Buffer.from(JSON.parse(process.env.MOBILE_AUTH_IV));

    const normalized = v.replace(/%20/g, '+').replace(/ /g, '+');
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(normalized, 'base64', 'ascii');
    decrypted += decipher.final('ascii');
    decrypted = decrypted.replace(/\./g, '');

    // Expected format: MM/dd/yyyy HH:mm (matches the old app's DateTime.ParseExact)
    const match = decrypted.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
    if (!match) return { valid: false, message: 'Bad Response' };

    const [, month, day, year, hour, minute] = match;
    const tokenTime = new Date(year, month - 1, day, hour, minute);
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    if (tokenTime >= cutoff) return { valid: true };
    return { valid: false, message: 'Request TimeOut' };
  } catch (err) {
    return { valid: false, message: 'Bad Response' };
  }
}

module.exports = { validateSignature };
