# 📱 GenZ Retail Store Management - User Manual (Tenglish Guide)

Welcome to **GenZ Store Management App**! Ee user manual meeku **GenZ Store Admin App** mariyu **GenZ Store Staff App** rendinti full setup & daily operations step-by-step clear ga vivaristundi.

---

## 📌 App Downalods & Dual Install (Rendu Apps Saparate Ga Install Cheyandi)

Mee mobile lo Admin and Staff rendoo okka phone lonae install cheskovachu. Package IDs verugaa unnayi:

| App Type | App Name | Package ID | Purpose | Download File |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin App** | **GenZ Store Admin** | `com.genz.retail.admin` | Business Owner & Co-Admins Daily Monitor Cheyadaniki | **[admin-app-debug.apk](file:///Users/mac/Desktop/GenZ/admin-app-debug.apk)** |
| **📱 Staff App** | **GenZ Store Staff** | `com.genz.retail.staff` | Store Staff Daily Sales & Bill Receipt Photos Upload Cheyadaniki | **[staff-app-debug.apk](file:///Users/mac/Desktop/GenZ/staff-app-debug.apk)** |

---

## 📱 PART 1: GenZ Store Staff App (Staff Operational Guide)

### 1. Staff Login (Sign In)
- **Staff App** open cheyandi.
- Mee Admin ichina **Staff ID (Phone Number)** mariyu **Password** type chesi **Sign In to Workspace** click cheyandi.
- Default fields blank ga untayi, mee details matrame enter cheyali.

### 2. Daily Sales Report Submit Chese Vidhanam
1. Menu lo **Submit Daily Sales** screen ki randi.
2. **Submission Date**: By default eroju date auto-select avutundi.
3. **Select Assigned Shop**: Mee store outlet branch (e.g., Metro Branch / Main Branch) select cheyandi.
4. **Total Day Sales Amount (₹ INR)**: Eroju counter final cash/online sales amount exact ga enter cheyandi (e.g. ₹25,400).
5. **Camera Bill Receipt Capture**:
   - Live Camera button tap chesi counter bill receipt bill proof photo capture cheyandi.
   - Photo automatic ga high quality + compressed weight lo save avutundi.
6. **Submit Daily Report**: Blue button click cheyandi. Immediately status **Under Review** ki velthundi.

### 3. Native Android Push Notifications & Updates
- Sales submit chesina tarvatha, Admin mee report ni **Approved** or **Correction Requested** ga mark cheyagane, mee mobile system notification bar lo direct alert vasthundi!
- Daily 18:00 IST ki counter close chesi report submit cheyali ani automatic Android alert reminder kuda vasthundi.

---

## 👑 PART 2: GenZ Store Admin App (Business Owner & Manager Guide)

### 1. Admin Portal Navigation
- **GenZ Store Admin App** open chesi business email and password dwara login avvandi.
- Login avvagane sidebar automatic ga closed ga untundi, so direct **Operational Business Metrics Dashboard** kanipistundi.

### 2. Multi-Admin Access & Co-Admin Users Add Cheyadam
1. **User & Access Management** (`StaffManagement.tsx`) open cheyandi.
2. **Admin & Manager Accounts** tab select chesi **"+ Add Admin User"** click cheyandi.
3. Co-Admin Name, Email, Password & Role select cheyandi:
   - **Business Admin**: Full control permissions.
   - **Co-Admin**: Store operations monitoring.
   - **Store Manager**: Sales view & review access.
4. Saved Admin account tho vaalu saporate mobile lo login avvachu.

### 3. Store Staff Credentials Generate Cheyadam
1. **Store Staff Accounts** sub-tab open chesi **"+ Generate Staff Login"** click cheyandi.
2. Staff Full Name, Mobile Phone Number, Email enter cheyandi.
3. App automatic 10-digit Staff ID & Password generate chesthundi.
4. Direct **"Copy Login"** click chesi WhatsApp dwara staff ki send cheyavachu.
5. Dropdown dwara particular shop outlets ki staff ni link cheyavachu.

### 4. Shop Management & Deleting Shops
1. **Shop Management** (`ShopManagement.tsx`) open cheyandi.
2. **"+ Add New Shop"** click chesi branch name, outlet code, location enter cheyandi.
3. Edaina Shop outlet delete cheyalante, store card pyna unna **Red Trash 🗑️ (Delete Shop)** button click chesi confirm cheyandi.

### 5. Line Graph & Live Sales Performance
- Dashboard center lo **Sales Trend Line Graph** live continuous curve gradient visualizes chesthundi.
- Bar charts badulu smooth line trend graph dwara real-time business performance track cheyavachu.

### 6. Executive A4 PDF Report Export
1. Menu lo **Reports & Settings** (`ReportGenerator.tsx`) open cheyandi.
2. Date range & Shop select chesi **"Generate Executive PDF Report"** click cheyandi.
3. Directly print or PDF format lo phone storage lo save cheskovachu.

---

## 🌙 PART 3: Dark Mode (Deep Pitch Dark Theme Setup)

1. **Dark Mode Enable Cheyadam**:
   - **App Settings** (`BusinessSettingsView.tsx`) open cheyandi.
   - **App Display Theme (Dark Mode)** card lo **"Switch to Dark Mode 🌙"** click cheyandi.
   - Or **Sidebar** bottom user profile box daggara 1-tap **Dark Mode** button click cheyandi.
2. **Dark Theme Features**:
   - Everything deep pitch dark background (`#090D16` / `#111827`) ki maruthundi.
   - All text, headers, numbers & values pure high-contrast white (`#FFFFFF`) lo clear ga kanipisthayi.
   - Setting choice automatic ga phone local storage lo permanent ga save avutundi.

---

## ⚙️ Android OS Permissions Checklist

App first time open chesinapudu kindhi native permissions Allow cheyali:
- 📷 **CAMERA**: Receipt photos capture cheyadaniki.
- 🖼️ **READ_MEDIA_IMAGES / STORAGE**: Gallery photo proofs picking ki.
- 🔔 **POST_NOTIFICATIONS**: Direct system tray alerts and closing reminders ki.
- 📍 **LOCATION / ACCESS_FINE_LOCATION**: Shop branch proximity audit ki.

---
*GenZ Retail Platform • Fashion & Footwear Store Management SaaS*
