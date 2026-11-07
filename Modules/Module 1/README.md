# Module 1: Core Management & Transformation

## 1. Unified Multi-Format Auth & Account Management
**Assigned feature:** Authentication

Google sign-in and the security-PIN flow are implemented. MFA and SMS/email verification are not currently implemented.

**Existing code:** [Sign-in page](../../frontend/js/auth.js), [auth controller](../../backend/controllers/authController.js), [Firebase Admin verification](../../security/firebaseAdmin.js), [auth routes](../../backend/routes/auth.js), [user queries](../../database/queries/users.js).

## 2. Multi-Format Document Ingestion
**Assigned features:** Personal Vault, Financial Vault, Certificates, File Converter

File uploads and local file storage are implemented for the existing vault features.

**Existing code:** [upload middleware](../../backend/middleware/upload.js), [storage service](../../backend/services/storage.js), [Personal Vault](../../backend/controllers/personalVaultController.js), [Financial Vault](../../backend/controllers/financialVaultController.js), [Certificates](../../backend/controllers/certificatesController.js), [File Converter](../../backend/controllers/fileConverterController.js).

## 3. Dynamic Image-to-PDF Conversion Engine
**Assigned feature:** File Converter

Image-to-PDF conversion is implemented.

**Existing code:** [conversion service](../../backend/services/conversionService.js), [converter controller](../../backend/controllers/fileConverterController.js), [converter page](../../frontend/js/file-converter.js).

## 4. OCR Text Extraction & Searching
**Assigned features:** Personal Vault, Financial Vault, Certificates

Image OCR and Personal Vault text search are implemented.

**Existing code:** [OCR service](../../backend/services/ocrService.js), [Personal Vault search](../../database/queries/personalVault.js), [Personal Vault controller](../../backend/controllers/personalVaultController.js), [Financial Vault controller](../../backend/controllers/financialVaultController.js), [Certificates controller](../../backend/controllers/certificatesController.js).