# GenZ — Native Mobile App & Device Permissions PRD

**Product Name:** GenZ Native Mobile Application (Android & iOS)  
**Document Type:** Mobile App Architecture, Native Device Permissions & RBAC PRD  
**Target Platforms:** Android (SDK 24+ / Android 7.0+) & iOS (iOS 14.0+)  
**Backend & Realtime:** Supabase DB + Realtime Subscriptions + Storage Bucket  

---

# 1. Executive Summary

This Product Requirements Document (PRD) defines the complete technical specifications for building the **GenZ Native Mobile Application** across iOS and Android platforms.

It details:
1. **Native Hardware & OS Device Permissions** (Camera, Media Storage, Biometrics, Push Notifications, Location).
2. **Role-Based Access Control (RBAC) & Staff Permission Matrix** (Numeric Staff ID authentication, granular shop access).
3. **Offline-First Architecture & Media Compression Engine** (Capturing photo receipts offline and auto-syncing over Supabase Realtime).

---

# 2. Native OS Device Permissions Architecture

To ensure user privacy compliance (Apple App Store Review Guidelines & Google Play Privacy Policies), the GenZ mobile app declares clear permission keys, explicit user consent prompts, and fallback behaviors.

### 2.1 Native Hardware Permissions Table

| Device Feature | OS Permission Key (Android) | OS Permission Key (iOS) | Mandatory / Optional | Business Purpose & User Consent Prompt Text |
| :--- | :--- | :--- | :--- | :--- |
| **Camera** | `android.permission.CAMERA` | `NSCameraUsageDescription` | **Mandatory** for Staff | *"GenZ requires camera access to capture daily sales closing register receipt photo proofs."* |
| **Photo Gallery / Storage** | `android.permission.READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | `NSPhotoLibraryUsageDescription` | **Optional** | *"GenZ needs photo gallery access to allow staff to select saved receipt images from device storage."* |
| **Biometric Auth** | `android.permission.USE_BIOMETRIC` | `NSFaceIDUsageDescription` | **Optional** (Staff preference) | *"GenZ uses Face ID / Fingerprint to allow staff to quickly unlock the app using their Numeric Staff ID."* |
| **Push Notifications** | `android.permission.POST_NOTIFICATIONS` | APNs Notification Permission | **Mandatory** for Reminders | *"GenZ sends push notifications for 18:00 daily sales reminders and instant admin correction requests."* |
| **Location (Proximity)** | `android.permission.ACCESS_FINE_LOCATION` | `NSLocationWhenInUseUsageDescription` | **Optional** (Audit flag) | *"GenZ verifies your device location when submitting daily sales to confirm shop branch proximity."* |

---

# 3. Staff Permission Matrix & Role-Based Access Control (RBAC)

The platform enforces strict granular security scoping across all tenant operations.

### 3.1 Role Hierarchy & Granular Scopes

```text
SUPER_ADMIN (Platform Operations)
    └─ BUSINESS_ADMIN (Business Owner / Tenant Admin)
            ├─ MANAGER (Multi-Shop Branch Manager)
            ├─ SUPERVISOR (Single Shop Supervisor)
            └─ FIELD_STAFF (Shop Daily Sales Submitter)
```

### 3.2 Granular Permission Capabilities Matrix

| Capability / Action | SUPER_ADMIN | BUSINESS_ADMIN | MANAGER | SUPERVISOR | FIELD_STAFF |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Submit Daily Sales + Photo Proof** | ❌ | ❌ | ⚠️ Optional | ✅ | ✅ |
| **Approve / Request Correction** | ❌ | ✅ | ✅ | ⚠️ Assigned Shops | ❌ |
| **View Sales Calendar Grid** | ✅ | ✅ | ✅ | ⚠️ Assigned Shops | ❌ |
| **Add / Invite Staff Members** | ✅ | ✅ | ⚠️ With Permission | ❌ | ❌ |
| **Generate Numeric Staff ID & Password** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Add / Edit Retail Shop Locations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Export PDF & Digital Reports** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View Cross-Tenant Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

# 4. Native Authentication Architecture

### 4.1 Numeric Staff ID & Alphanumeric Password Rules
1. **Numeric Staff ID**: Strictly 6-digit numeric string (e.g. `849201` or `749201`).
   - Enforced on mobile software keyboards via `inputMode="numeric"` and `keyboardType="number-pad"`.
2. **Password**: Alphanumeric + Special Characters (e.g. `Gz@8392!K`).
   - Interactive Eye icon toggle button (`<Eye />` / `<EyeOff />`) on all password fields.

### 4.2 Biometric Quick Sign-In (TouchID / FaceID)
- After initial login with Staff ID and Password, the app prompts: *"Enable Face ID / Fingerprint for GenZ?"*.
- Credentials stored securely in iOS Keychain / Android Keystore for zero-friction daily sign-in.

---

# 5. Native Media Compression & Offline-First Sync Engine

### 5.1 On-Device Image Compression Engine
- High-resolution camera photos (typically 8MB – 12MB) are automatically compressed on-device before uploading:
  - **Max Dimensions**: 1920px × 1080px.
  - **Compression Format**: JPEG / WebP at 75% quality.
  - **Target File Size**: ~180KB – 250KB per receipt photo.
  - **Result**: Reduces mobile data consumption by **98%** and ensures uploads succeed over 3G/4G connections.

### 5.2 Offline-First Local Cache Architecture
1. If staff members submit sales in low-connectivity areas (e.g., basement shop branches), the entry is saved locally in SQLite / AsyncStorage with status `DRAFT_OFFLINE`.
2. As soon as device connectivity is restored, the background sync service automatically uploads the entry to Supabase DB and Storage Bucket in the background over **Supabase Realtime**.

---

# 6. Verification & Acceptance Criteria

1. **Permission Consent Handling**: App gracefully handles permission rejection (e.g., if camera permission is denied, presents a clean fallback dialog explaining how to enable Camera in System Settings).
2. **Security Compliance**: Sensitive credentials (passwords, auth tokens) are encrypted in hardware-backed storage (`Keychain` / `EncryptedSharedPreferences`).
3. **Build Target**: Clean build against Android SDK 34 and iOS 17 with 0 native build warnings.
