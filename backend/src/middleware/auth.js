const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT from the Authorization header (Bearer token).
 * On success, attaches the decoded payload to req.user.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restricts a route to specific DesignationIDs, mirroring the old
 * Session["DesignationID"] checks scattered through the .aspx.cs files.
 * Usage: requireRole([1, 4])
 */
function requireRole(allowedDesignationIds) {
  return (req, res, next) => {
    if (!req.user || !allowedDesignationIds.includes(req.user.designationId)) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
