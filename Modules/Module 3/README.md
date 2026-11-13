# Module 3: Organization & Value-Added Tools

## 9. Smart Categorization & Tagging [Nihad Rahman Rawdra 232-35-520]
**Assigned features:** Personal Vault, Financial Vault, Certificates

Users can mark uploaded vault files as Favourite or Emergency and browse or search the two categories in File Converter. Deleting a file also removes its category assignments.

**Existing code:** [file category queries](../../database/queries/customCategories.js), [file category API](../../backend/controllers/customCategoriesController.js), [File Converter](../../frontend/js/file-converter.js).

## 10. Secure Password & Credential Vault [Nihad Rahman Rawdra 232-35-520]
**Assigned feature:** Password Manager

The Password Manager supports creating, viewing, updating, and deleting saved credentials. Selected fields are encrypted by the backend.

**Existing code:** [Password Manager page](../../frontend/js/password-manager.js), [controller](../../backend/controllers/passwordManagerController.js), [database queries](../../database/queries/passwordManager.js), [field encryption](../../security/encryption.js).

## 11. Frequently Asked Questions [Adnan Akib 232-35-009]
**Assigned feature:** About Us

The About Us page includes ten numbered question-and-answer entries covering DigiVault storage, account protection, OCR, file IDs, session timeout, security activity, folders, and backup limitations.

**Existing code:** [About Us and FAQ page](../../frontend/about.html).

## 12. Offline Access & Local Backup Export [Zareen Sultana 232-35-483]
**Assigned features:** Personal Vault, Financial Vault, Quick Records, Password Manager, Certificates

The backend stores app records in a local SQLite file and uploaded files on local disk. Account > Local Backup can export a ZIP containing uploaded vault files and non-sensitive file metadata. Passwords, bank details, quick records, OCR text, and converted outputs are excluded. Export requires a PIN-verified session. Google sign-in still requires internet access.

**Existing code:** [backup export](../../backend/services/backupService.js), [profile route](../../backend/routes/profile.js), [SQLite adapter](../../database/db.js), [SQLite schema](../../database/schema.sql), [file storage service](../../backend/services/storage.js).
