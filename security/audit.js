const auditLogs = require('../database/queries/auditLogs');

async function logAction(req, { action, feature, metadata }) {
  const userId = req.user ? req.user.userId : null;
  const ipAddress = req.ip || (req.connection && req.connection.remoteAddress) || null;
  await auditLogs.recordLog({ userId, action, feature, metadata, ipAddress });
}

module.exports = { logAction };
