require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const personalVaultRoutes = require('./routes/personalVault');
const financialVaultRoutes = require('./routes/financialVault');
const quickRecordsRoutes = require('./routes/quickRecords');
const passwordManagerRoutes = require('./routes/passwordManager');
const certificatesRoutes = require('./routes/certificates');
const fileConverterRoutes = require('./routes/fileConverter');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/personal-vault', personalVaultRoutes);
app.use('/api/financial-vault', financialVaultRoutes);
app.use('/api/quick-records', quickRecordsRoutes);
app.use('/api/password-manager', passwordManagerRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/file-converter', fileConverterRoutes);
app.use('/api/profile', profileRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Unexpected server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`DigiVault backend listening on port ${PORT}`);
});

module.exports = app;
