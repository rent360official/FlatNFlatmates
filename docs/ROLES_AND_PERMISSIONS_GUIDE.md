# FlatNFlatmates — Roles, Permissions & Access Control Matrix

This document and the companion Excel spreadsheet (`FlatNFlatmates_Roles_and_Permissions_Matrix.xlsx`) provide the definitive, single-source-of-truth reference for all user roles, backoffice modules, permissions, and security guardrails across the platform.

---

## 📊 Companion Excel Spreadsheet
The official Excel workbook is maintained in the `docs/` directory:
- [`docs/FlatNFlatmates_Roles_and_Permissions_Matrix.xlsx`](file:///e:/Professional/FlatNFlatmates/Development/code_v2/docs/FlatNFlatmates_Roles_and_Permissions_Matrix.xlsx)

### 🔄 How to Update or Regenerate the Excel Sheet
Whenever roles, permissions, or modules change in code, run:
```bash
npm run export:roles-matrix
```
This will automatically parse the latest business rules and rewrite both Excel files with adjusted column widths and data.

---

## 1. System Roles Summary & Hierarchy

| Role Key | Display Name | Hierarchy Tier | Backoffice Console | Sensitive Data & PII | Primary Purpose & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `super_admin` | **Super Administrator** | Tier 1 (Root Platform Governance) | **Full Access** | Full (Unrestricted) | Full platform control: feature flag kill-switches, rollout percentages, whitelist management, database schemas, role elevations, and system configs. |
| `ops_admin` | **Operations Administrator** | Tier 2 (City & Operations Lead) | **Elevated Access** | High (Masked telephony, telemetry, users) | Day-to-day Pune operational management: demand analytics, Facebook group community links, city/locality/POI configurations, user verification, and vibe upgrades. |
| `moderator` | **Content & Trust Moderator** | Tier 3 (Trust & Safety) | **Review Access** | Medium (Verification IDs, listings) | Review and approve/reject user verifications, reverification requests, review flagged properties, and oversee vibe request tickets. Blocked from Demand Analytics & FB Groups. |
| `support_agent` | **Customer Support Representative** | Tier 4 (Customer Service) | **Read-Only** | Limited / Masked | View user profiles, verification statuses, telephony connection history, and assist customers facing issues. Cannot edit records or elevate roles. |
| `owner` | **Property Owner / Lister** | Tier 5 (Supply-Side Partner) | **None (Owner Portal)** | Own Listings Only | Create and manage flat listings, upload room photos, set zero-brokerage flags, amenities, pet policies, and request Vibe upgrades. |
| `user` | **Tenant / Roommate Seeker** | Tier 6 (Demand-Side Consumer) | **None (Consumer App)** | Public Profiles & Calls | Search flats and flatmates, filter by commute nodes and lifestyle matrix, build seeker profiles, initiate masked calls, and join Facebook groups. |
| `tester` | **QA / Beta Tester** | Tier 7 (QA & Verification) | **None (Consumer App)** | Standard Scope | Test experimental features, QA beta feature flags, simulate masked calling, and validate compatibility matching algorithms. |

---

## 2. Core Access Control Matrix (CRUD & RACI)

| Module / Feature Area | Detailed Capability | `super_admin` | `ops_admin` | `moderator` | `support_agent` | `owner` | `user` | `tester` | Route / Endpoint | Enforcement Layer |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Demand Analytics** | Live search telemetry, budget histograms, BHK distributions, shortage gaps | **Full** | **Full** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/demand-analytics` | Server Page Guard + Action Role Guard |
| **Facebook Groups** | Manage locality Facebook group community URLs & member counts | **Full (CRUD)** | **Full (CRUD)** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/facebook-groups` | Server Page Guard + Action Role Guard |
| **Feature Management** | Register features, toggle status, set rollout %, user whitelists & rules | **Full (CRUD)** | Read-Only | Read-Only | Read-Only | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/features` | Page Guard + Server Action Write Guard |
| **User Management** | Elevate / demote user roles (`super_admin`, `ops_admin`, etc.) | **Full Control** | **Full Control** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/users` | `adminUpdateUserRole` Action + Audit Log |
| **User Verification** | Approve verification, reject with reasons, review reverification | **Full Control** | **Full Control** | **Full Control** | Read-Only | ❌ Blocked | Submit Request | ❌ Blocked | `/admin/users` | Server Action Write Guard |
| **Vibe Requests** | Manage photography & styling status (requested -> in_progress -> completed) | **Full Control** | **Full Control** | **Full Control** | Read-Only | Submit Request | Submit Request | Submit Request | `/admin/vibe-requests` | Server Action Role Check |
| **Cities & Localities** | Add / edit / deactivate Pune localities, metro stations, POIs | **Full (CRUD)** | **Full (CRUD)** | **Full (CRUD)** | Read-Only | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/cities` | Server Action Guard |
| **Audit Logs** | Immutable chronological stream of admin actions & role elevations | **Full Access** | **Full Access** | **Full Access** | **Full Access** | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/audit-logs` | Admin Layout Guard |
| **Call Networking** | View masked virtual call logs, durations, and connection metrics | **Full Access** | **Full Access** | **Full Access** | **Full Access** | Own Calls | Initiate Call | Initiate Call | `/admin/call-logs` | Admin Layout Guard / Consumer API |
| **System Settings** | Platform configuration, maintenance mode, contact numbers | **Full Control** | **Full Control** | Read-Only | Read-Only | ❌ Blocked | ❌ Blocked | ❌ Blocked | `/admin/settings` | Server Action Guard |
| **Property Listings** | Create, edit, publish flat listings, manage rent & availability | **Full Control** | **Full Control** | Moderate Flagged | Read-Only | **Own Listings** | ❌ Blocked | Create Test | `/owner/dashboard` | Owner Auth + Ownership Guard |
| **Seeker Profiles** | Build flatmate compatibility matrix, lifestyle preferences | Moderate | Moderate | Moderate | Read-Only | View Public | **Own Profile** | **Own Profile** | `/profile`, `/seeker/edit` | User Session Check |
| **Public Search** | Search flats & flatmates with commute nodes and multi-filters | Full Access | Full Access | Full Access | Full Access | Full Access | Full Access | Full Access | `/search/flats`, `/search/flatmates` | Public Route + Demand Telemetry |
| **Facebook CTA** | View and open locality community group modal from search results | Full Access | Full Access | Full Access | Full Access | Full Access | Full (Flagged) | Full Access | `/search/flats`, `/search/flatmates` | Client CTA + Feature Flag |

---

## 3. Backoffice Navigation & Visibility Rules

```mermaid
graph TD
    AdminLogin[Admin User Login] --> RoleCheck{User Role?}
    
    RoleCheck -->|super_admin / ops_admin| SuperOpsNav[Visible Sidebar Modules:
    - Dashboard
    - Demand Analytics 🔒
    - Facebook Groups 🔒
    - Cities & Localities
    - Users Management
    - Vibe Upgrade Requests
    - Call Networking
    - Audit Logs
    - Feature Management
    - System Config]
    
    RoleCheck -->|moderator / support_agent| StaffNav[Visible Sidebar Modules:
    - Dashboard
    - Cities & Localities
    - Users Management
    - Vibe Upgrade Requests
    - Call Networking
    - Audit Logs
    - Feature Management (Read-Only)
    - System Config (Read-Only)
    (Demand Analytics & FB Groups HIDDEN)]
    
    RoleCheck -->|user / owner / tester| Blocked[Access Denied / 403 Redirect to Home]
```

---

## 4. Maintenance & Developer Guidelines

### How to Add a New Role in the Codebase:
1. **Schema Definition**: Add the role string to the enum in [`src/models/User.ts`](file:///e:/Professional/FlatNFlatmates/Development/code_v2/src/models/User.ts).
2. **NextAuth Types**: Ensure the role type is included in [`src/types/next-auth.d.ts`](file:///e:/Professional/FlatNFlatmates/Development/code_v2/src/types/next-auth.d.ts).
3. **Sidebar Navigation**: Update `roles` array for any navigation links in [`src/components/AdminLayout.tsx`](file:///e:/Professional/FlatNFlatmates/Development/code_v2/src/components/AdminLayout.tsx).
4. **Server Actions & Route Guards**: Enforce the role checks in relevant server components (`page.tsx`) and server actions (`actions.ts`).
5. **Update Matrix**: Update [`scripts/generate_roles_matrix.ts`](file:///e:/Professional/FlatNFlatmates/Development/code_v2/scripts/generate_roles_matrix.ts) and run `npm run export:roles-matrix`.
