# 📱 GenZ Shop & Retail Management System — Complete User Manual (Tenglish)

Ee user manual lo **GenZ Store Admin APK** mariyu **GenZ Staff APK** complete usage, setup mariyu features telugulo english script (Tenglish) lo explain cheyabadindi.

---

## 🚀 Overview (App Parichayam)

GenZ Retail App lo standard 2 separate mobile applications unnay:
1. **GenZ Store Admin APK** (`com.genz.retail.admin`): Store Business Owner & Co-Admins kosam.
2. **GenZ Staff APK** (`com.genz.retail.staff`): Store Staff & Sales Employees kosam.

Dhanini Supabase Real-Time Database balance chesi 1-2 seconds lo multi-device sync dwara design chesam.

---

## 👨‍💼 1. GenZ Store Admin App Guide (`GenZ Store Admin`)

### 🔑 A. Login & Access Control
- **Login Options**:
  - Direct **Google Sign-In** button click chesi Google account thoti login avvachu.
  - Lekapothe Admin Email (`sonu119181@gmail.com`) mariyu Admin Password thoti manual login avvachu.

---

### 🏪 B. Stores & Outlets Management (Shops Add & Delete)
- **New Store Add Cheyadam**:
  1. Admin App open chesi **Stores & Outlets** section ki vellandi.
  2. **+ Register New Store** button ni press cheyandi.
  3. Store Name, Branch Code, Address mariyu Phone Contact number enter chesi **Create Store Outlet** click cheyandi.
  4. Instant ga store save iyyi **Staff APK** lo 1-2 seconds lo automatic ga display avthundhi.
- **Store Delete Cheyadam**:
  - Edhainaa Store ni delete cheyali ante Store Card pakkana unna Red **Delete** (🗑️) icon click chesi confirm cheyandi.
  - Delete aina store **Staff APK** dropdown nundi ventane automatic ga remove aipothundhi.

---

### 👥 C. Staff Members Management (Staff Add & Delete)
- **New Staff Member Registration**:
  1. **Staff & Admin Management** tab open chesi **+ Register Staff Member** click cheyandi.
  2. Staff Name, Email, Phone Number enter cheyandi.
  3. **Auto-Generate Password** (🔄) button click cheste strong password generate avthundhi. *(Note: Ee password continuous ga loop avvakunda fix chesam, okka sari click chesinappude change avthundhi).*
  4. Staff ki assign cheyalsina Store Outlets select chesi **Save Staff Member** click cheyandi.
- **Staff Deletion & Real-Time Kickout**:
  - Staff ni delete cheyali ante Staff List lo unna Red **Delete** (🗑️) icon click cheyandi.
  - **Instant Kickout Protection**: Delete aina staff eppudina Staff APK lo active ga unte, 1-2 seconds lo vallu automatic ga **Logout** iyyi Login screen ki vellipotharu.
  - Repu malli aa staff login avvalani try cheste **"Access Denied: Your staff account has been deleted by Admin"** ani block chesthundhi.

---

### 👨‍💻 D. Co-Admin Management
- **Co-Admin Add Cheyadam**:
  1. **Staff & Admin Management** tab lo **+ Register Co-Admin** click cheyandi.
  2. Co-Admin Name, Email ID mariyu Password enter chesi save cheyandi.
  3. Co-Admins Supabase DB lo permanent ga save avtharu.
- **Co-Admin Delete Cheyadam**:
  - Co-Admin card pakkana unna **Delete** (🗑️) icon click cheste instant ga DB nundi permanent ga remove aipotharu.

---

### 📑 E. Daily Sales Verification & Approvals
- **Verification Queue**:
  1. Staff submit chesina daily sales data Admin App lo **Verification Queue** (Verification & Approvals) tab lo realtime lo kanipisthundhi.
  2. Submissions lo Sales Amount, Date, Staff Name, Shop Branch Name mariyu Photo Proof receipt screenshot kanipisthayi.
- **Approve / Reject**:
  - **Approve**: Sales data correct ga unte **Approve** click chesi accept cheyachu.
  - **Reject / Correction**: Issue unte **Request Correction** click chesi rejection reason enter cheyachu.
- **Delete Submission (🗑️)**:
  - Admin direct ga unwanted test submission ni delete cheyali ante Card lo unna **Trash Icon** (🗑️) click chesi delete cheyachu.

---

## 👷‍♂️ 2. GenZ Staff App Guide (`GenZ Staff`)

### 🔑 A. Staff Login
1. Staff APK open chesi mee **Mobile Phone Number** (or Staff ID) mariyu Admin set chesina **Password** enter cheyandi.
2. Login aina ventane **Submit Daily Sales** screen open avthundhi.

---

### 💵 B. Submit Daily Sales (Daily Collection Upload)
1. **Select Shop Outlet**: Dropdown menu nundi mee Store Branch select cheskondi.
2. **Sales Amount**: Aa roju zilina total sales amount enter cheyandi.
3. **Photo Proof**: Camera icon click chesi Bill / Cash receipt photo attach cheyandi.
4. **Notes**: Aina extra notes / remarks unte enter chesi **Submit Daily Sales** button press cheyandi.
5. Instant ga data Admin App ki send aipothundhi.

---

### 🗑️ C. Unsend / Delete Submission Feature
- Staff submit chesina sales entry lo edhainaa mistake unte lekapothe unsend cheyali ante:
  1. **Submit Daily Sales** or **My Submissions** tab lo entry kinda unna Red **Unsend / Delete** (🗑️) button click cheyandi.
  2. **Confirm Delete** click cheyandi.
  3. Submission Staff App mariyu Admin App nundi instant ga remove aipothundhi.

---

### 🔄 D. Drag to Refresh / Pull to Refresh
- Screen top nundi kinda ki drag/pull cheste (**Drag to Refresh**) updated Store list, Submissions status (APPROVED / REJECTED) reload avthundhi.

---

## ⚡ Real-Time Features Summary Table

| Feature | Action | Real-Time Result |
|---|---|---|
| **Unsend Sales Entry** | Staff clicks **Unsend / Delete** | Admin Verification Queue nundi 1-2 sec lo remove avthundhi |
| **Delete Store Branch** | Admin deletes Shop | Staff App store dropdown nundi 1-2 sec lo remove avthundhi |
| **Delete Staff Account** | Admin deletes Staff | Staff App lo login unna staff 1-2 sec lo auto logout iyyi block avtharu |
| **Delete Co-Admin** | Admin deletes Co-Admin | Supabase DB nundi permanent ga remove avtharu |
| **Password Generator** | Admin clicks **Auto-Generate** | Continuous loop lekunda 1 time update avthundhi |

---

### 💡 Help & Support
Aina doubts or technical issues unte Admin App Settings tab lo Support Email dwara communicate avvachu.
