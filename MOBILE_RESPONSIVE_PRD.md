# GenZ — Mobile Responsiveness & Layout Architecture PRD

**Product Name:** GenZ Multi-Tenant Shop Management Platform  
**Document Type:** Mobile Responsiveness, Spacing System & Layout Standards PRD  
**Target Viewports:** Mobile (320px – 639px), Tablet (640px – 1023px), Desktop (1024px+)  
**Design System:** Human Color Psychology + Ergonomic Spacing Engine  

---

# 1. Executive Summary

This Product Requirements Document (PRD) establishes the precise standards for **Mobile Responsiveness**, **Ergonomic Spacing Systems**, **Adaptive Grid Layouts**, and **Touch Interaction Guidelines** for the **GenZ** platform.

The goal is to guarantee that every single component—from the 7-column Sales Matrix Grid to staff daily sales photo submissions—behaves smoothly, looks craftsman-made, and provides comfortable touch ergonomics on all mobile, tablet, and desktop viewports.

---

# 2. Viewport Breakpoint Architecture

| Breakpoint Symbol | Width Boundary | Target Hardware | Primary Layout Behavior |
| :--- | :--- | :--- | :--- |
| **`xs`** | `320px – 479px` | Compact Smartphones (iPhone SE, Android) | 1-Column vertical stack, horizontal scroll for tables |
| **`sm`** | `480px – 639px` | Standard Smartphones (iPhone 14/15, Galaxy) | 1 to 2-Column fluid grid, 44px+ touch targets |
| **`md`** | `640px – 767px` | Large Phones & Mini Tablets | 2-Column grid, collapsible navigation |
| **`lg`** | `768px – 1023px` | Tablets & iPad Portrait | Sidebar + Main workspace flex layout |
| **`xl`** | `1024px – 1279px` | iPad Pro & Small Laptops | Full desktop matrix, fixed sidebar (256px) |
| **`2xl`**| `1280px+` | Large Desktop Monitors | Max container width constraint (`max-w-7xl` / 1280px) |

---

# 3. Spacing System & Padding Tokens

The GenZ spacing engine relies on a strict **4px modular grid system** (`rem` units in Tailwind CSS):

### 3.1 Component Padding Scale
- **Micro Padding (`p-1` / 4px)**: Badge pills, icon button internal spacing.
- **Compact Padding (`p-2` / 8px – `p-2.5` / 10px)**: Form inputs, table cells, mobile card headers.
- **Default Container Padding (`p-4` / 16px – `p-5` / 20px)**: Mobile workspace cards, modal dialogs, drawer panels.
- **Desktop Section Padding (`p-6` / 24px – `p-8` / 32px)**: Desktop workspace cards, dashboard welcome banners, sales grid containers.

### 3.2 Dynamic Spacing Rules
```css
/* Responsive Card Spacing Utility */
.card-responsive {
  padding: 1rem; /* 16px on mobile */
}

@media (min-width: 640px) {
  .card-responsive {
    padding: 1.5rem; /* 24px on tablet/desktop */
  }
}
```

---

# 4. Ergonomic Touch Targets & Interactive Controls

### 4.1 Touch Boundary Mandate
- **Minimum Tap Target**: `44px × 44px` on all mobile viewports for clickable buttons, icon toggles, and form inputs.
- **Input Height Standard**: Minimum `48px` height (`py-3`) for form text fields to prevent accidental mis-clicks.
- **Select Dropdown Spacing**: Minimum `40px` tap height with distinct dropdown arrows (`ChevronDown`).

### 4.2 Form Control Touch States
- **Focus Rings**: `ring-2 ring-sapphire-500` with distinct border color change (`border-sapphire-600`) on input focus.
- **Password Input Eye Icon**: Right-aligned 44px touch area containing interactive `<Eye />` / `<EyeOff />` toggle icon.
- **Numeric Staff ID Field**: Input configured with `inputMode="numeric"` and regex filter (`\D/g`) to enforce numeric-only entry on mobile software keyboards.

---

# 5. Mobile Layout Standards by Component

### 5.1 Interactive Sales Calendar Grid (`SalesCalendar.tsx`)
- **7-Column Month Matrix Grid**:
  - Encapsulated inside a smooth horizontal scroll panning container (`overflow-x-auto min-w-[640px]`).
  - Guarantees 7-column calendar day cells remain perfectly proportioned without text clipping on 320px mobile screens.
  - Includes mobile swipe helper badge: `"👈 Swipe horizontally to pan calendar grid 👉"`.
- **Header Controls**:
  - Filter dropdowns (`Year`, `Shop`, `Staff`, `Status`) wrap into a clean 2-column mobile grid (`grid grid-cols-2 sm:flex`).
  - Matrix zoom buttons (`[Zoom Out]`, `[Reset]`, `[Zoom In]`) feature touch-friendly padded targets.

### 5.2 Topbar Navigation (`Navbar.tsx`)
- Fixed sticky header (`sticky top-0 z-40`) with 72px height (`h-18`).
- Mobile view displays logo mark, workspace selector dropdown, notification drawer trigger, and user account avatar pill.
- Persona toggles removed to maintain craftsman-made topbar spacing without clutter.

### 5.3 Sidebar Navigation (`Sidebar.tsx`)
- Fixed 256px width (`w-64`) on desktop (`md:flex`).
- Hidden on mobile screens in favor of clean single-column focus, with topbar dropdown drawer for navigation.

### 5.4 Daily Sales Submission Form (`DailySalesSubmission.tsx`)
- 1-Column mobile-first form layout.
- Photo proof upload box features camera capture trigger button and file picker with live thumbnail image preview container (`min-h-[220px]`).
- Submit button spans full mobile width (`w-full py-3.5`) with distinct sapphire glow shadow.

### 5.5 Data Tables & Verification Queues (`VerificationQueue.tsx`, `ShopManagement.tsx`, `StaffManagement.tsx`)
- Desktop: Structured HTML tables (`<table className="w-full">`).
- Mobile: Horizontal scroll table wrappers (`overflow-x-auto`) or mobile stacked card view (`grid grid-cols-1 md:grid-cols-2`).

---

# 6. Human Color Psychology Palette Implementation

| Color Token | Hex Code | Psychological Purpose | Application in Layout |
| :--- | :--- | :--- | :--- |
| **Trust Navy** | `#0F172A` | Authority, Stability, Craftsman Elegance | Topbar header, primary text headings, dark overlays |
| **Sapphire Blue** | `#2563EB` | Intelligence, Focus, Primary Interaction | Primary buttons, active tabs, focus borders, logo mark |
| **Growth Emerald** | `#059669` | Success, Profitability, Approval | Total sales figures, approved badges, success banners |
| **Focus Amber** | `#D97706` | Vigilance, Review Needed | Under review status badges, warning notifications |
| **Urgency Crimson** | `#E11D48` | Immediate Attention | Correction requested badges, error alerts |
| **Tier Purple** | `#7C3AED` | Premium Multi-Tenant Features | Special badges, audit trail highlights |

---

# 7. Verification & Acceptance Criteria

1. **Zero Horizontal Overflow on Body**: Page body (`<html>` / `<body>`) must never trigger unintended horizontal scrolling.
2. **Mobile Scroll Containers**: 7-column calendar matrix and multi-column data tables pan smoothly with touch inertia (`-webkit-overflow-scrolling: touch`).
3. **Compilation Quality**: Project builds cleanly via `npm run build` with **0 TypeScript and Vite compilation errors**.
