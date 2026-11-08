# Module 3: Organization & Value-Added Tools

## 9. Smart Categorization & Tagging [Nihad Rahman Rawdra 232-35-520]
**Assigned features:** Personal Vault, Financial Vault, Certificates

Basic file categories and folders are implemented. A general-purpose tagging feature is not currently implemented.

**Existing code:** [file categorization](../../backend/services/imageService.js), [Personal Vault queries](../../database/queries/personalVault.js), [Financial Vault queries](../../database/queries/financialVault.js), [Certificates queries](../../database/queries/certificates.js).

## 10. Secure Password & Credential Vault [Nihad Rahman Rawdra 232-35-520]
**Assigned feature:** Password Manager

The Password Manager supports creating, viewing, updating, and deleting saved credentials. Selected fields are encrypted by the backend.

**Existing code:** [Password Manager page](../../frontend/js/password-manager.js), [controller](../../backend/controllers/passwordManagerController.js), [database queries](../../database/queries/passwordManager.js), [field encryption](../../security/encryption.js).

## 11. Automated Expiry & Renewal Alerts [Adnan Akib 232-35-009]
**Assigned features:** Certificates, Quick Records

Not currently implemented. The current data model has no expiry-date or notification workflow.

**Related existing code:** [Certificates controller](../../backend/controllers/certificatesController.js), [Quick Records controller](../../backend/controllers/quickRecordsController.js), [SQLite schema](../../database/schema.sql).

## 12. Offline Access & Local Backup Export [Zareen Sultana 232-35-483]
**Assigned features:** Personal Vault, Financial Vault, Quick Records, Password Manager, Certificates

The backend stores app records in a local SQLite file and uploaded files on local disk. A backup-export workflow is not currently implemented, and Firebase sign-in still requires internet access.

**Existing code:** [SQLite adapter](../../database/db.js), [SQLite schema](../../database/schema.sql), [file storage service](../../backend/services/storage.js).
