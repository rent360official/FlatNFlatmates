import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates an Excel spreadsheet (.xlsx) detailing all System Roles,
 * Permissions, Backoffice Access, and Security Rules for FlatNFlatmates.
 */
function createRolesMatrixWorkbook() {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: ROLES OVERVIEW
  // ==========================================
  const rolesOverviewData = [
    {
      "Role Key": "super_admin",
      "Display Name": "Super Administrator",
      "Hierarchy Tier": "Tier 1 (Root Platform Governance)",
      "Backoffice Access": "Full Access",
      "PII & Telephony Visibility": "Full (Unrestricted)",
      "Core Purpose & Scope": "Complete system governance, feature flag toggle & percentage rollouts, system maintenance, database schema management, and admin role elevation.",
      "Key Guardrails & Constraints": "Protected root role. Critical operations (role elevation, feature kill-switches) are logged to immutable Audit Logs."
    },
    {
      "Role Key": "ops_admin",
      "Display Name": "Operations Administrator",
      "Hierarchy Tier": "Tier 2 (City & Operations Management)",
      "Backoffice Access": "Elevated Access (Analytics, FB Groups, Cities, Users, Requests)",
      "PII & Telephony Visibility": "High (User profiles, contact inquiry telemetry, city demand telemetry)",
      "Core Purpose & Scope": "Day-to-day Pune operational management: demand telemetry analysis, Facebook group community routing, city/locality/POI configurations, user verification approvals, and vibe upgrade fulfillment.",
      "Key Guardrails & Constraints": "Cannot toggle critical global feature flags or alter core system environment configs without super_admin elevation."
    },
    {
      "Role Key": "moderator",
      "Display Name": "Content & Trust Moderator",
      "Hierarchy Tier": "Tier 3 (Trust & Safety / Review)",
      "Backoffice Access": "Operational Review Access (Users, Listings, Requests)",
      "PII & Telephony Visibility": "Medium (Public profiles, verification IDs, property photos)",
      "Core Purpose & Scope": "Quality assurance and trust moderation: approve or reject tenant verification requests, review flagged property listings, and oversee vibe request tickets.",
      "Key Guardrails & Constraints": "Strictly blocked from Demand Analytics, Facebook Group community configuration, and Feature Management."
    },
    {
      "Role Key": "support_agent",
      "Display Name": "Customer Support Representative",
      "Hierarchy Tier": "Tier 4 (Read-Only Customer Support)",
      "Backoffice Access": "Read-Only Console",
      "PII & Telephony Visibility": "Limited / Masked (Connection histories, user status)",
      "Core Purpose & Scope": "Handle customer inquiries, check verification ticket statuses, look up property inquiry logs, and assist users facing onboarding issues.",
      "Key Guardrails & Constraints": "Read-only enforcement across all backoffice mutations (cannot edit users, cannot elevate roles, cannot alter properties or settings)."
    },
    {
      "Role Key": "owner",
      "Display Name": "Property Owner / Lister",
      "Hierarchy Tier": "Tier 5 (Supply-Side Partner)",
      "Backoffice Access": "None (Restricted to Owner Portal / Dashboard)",
      "PII & Telephony Visibility": "Own Listings & Incoming Inquiries Only",
      "Core Purpose & Scope": "Create and manage rental flats, set BHK configurations, zero brokerage status, amenities, WhatsApp contact preference, and request Vibe photoshoot/styling upgrades.",
      "Key Guardrails & Constraints": "Can only edit own property records. Blocked from accessing the /admin console."
    },
    {
      "Role Key": "user",
      "Display Name": "Tenant / Roommate Seeker",
      "Hierarchy Tier": "Tier 6 (Demand-Side Consumer)",
      "Backoffice Access": "None (Consumer Web App Only)",
      "PII & Telephony Visibility": "Public Seeker Profiles & Direct Contact Actions",
      "Core Purpose & Scope": "Search flats and flatmates with multi-parameter filters (commute nodes, lifestyle matrix, budgets), build compatibility profiles, and connect directly via Call, WhatsApp, and SMS interest.",
      "Key Guardrails & Constraints": "Default role assigned on registration. Blocked from backoffice."
    },
    {
      "Role Key": "tester",
      "Display Name": "QA / Beta Tester",
      "Hierarchy Tier": "Tier 7 (Testing & Preview Environment)",
      "Backoffice Access": "None (Consumer Web App with Feature Overrides)",
      "PII & Telephony Visibility": "Standard User Scope",
      "Core Purpose & Scope": "Special testing accounts used for end-to-end QA, verifying beta feature flags, testing contact inquiry workflows, and validating search algorithms.",
      "Key Guardrails & Constraints": "Subject to the same authorization security as regular users on production endpoints."
    }
  ];

  const wsOverview = XLSX.utils.json_to_sheet(rolesOverviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, "Roles_Overview");

  // ==========================================
  // SHEET 2: DETAILED ACCESS CONTROL MATRIX (RACI / CRUD)
  // ==========================================
  const accessMatrixData = [
    {
      "Module / Feature Area": "Demand Analytics & Search Intelligence",
      "Detailed Capability / Action": "View real-time tenant search filters, budget histograms, BHK distributions, shortage gaps, and live telemetry feed",
      "super_admin": "Full Access (View / Filter / Export)",
      "ops_admin": "Full Access (View / Filter / Export)",
      "moderator": "Blocked (Hidden & 403 Forbidden)",
      "support_agent": "Blocked (Hidden & 403 Forbidden)",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/demand-analytics",
      "Enforcement Layer": "Page Server Guard + Action Role Check ('super_admin', 'ops_admin')"
    },
    {
      "Module / Feature Area": "Facebook Group Community Routing",
      "Detailed Capability / Action": "Configure, create, update, and delete Facebook Group URLs and member counts mapped to Pune localities",
      "super_admin": "Full Control (CRUD)",
      "ops_admin": "Full Control (CRUD)",
      "moderator": "Blocked (Hidden & 403 Forbidden)",
      "support_agent": "Blocked (Hidden & 403 Forbidden)",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/facebook-groups",
      "Enforcement Layer": "Page Server Guard + Server Action Role Check ('super_admin', 'ops_admin')"
    },
    {
      "Module / Feature Area": "Feature Management & Feature Flags",
      "Detailed Capability / Action": "Register new features, toggle kill-switches, change rollout percentages, manage user whitelists, and configure rule targeting (e.g. property_interest_sms)",
      "super_admin": "Full Control (View / Create / Toggle / Edit Rules)",
      "ops_admin": "Read-Only (View Active Flags)",
      "moderator": "Read-Only (View Active Flags)",
      "support_agent": "Read-Only (View Active Flags)",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/features",
      "Enforcement Layer": "Page Guard (Admin) + Server Action Guard ('super_admin' only for writes)"
    },
    {
      "Module / Feature Area": "User Management & Role Elevation",
      "Detailed Capability / Action": "Change user role to super_admin, ops_admin, moderator, support_agent, owner, user, or tester",
      "super_admin": "Full Control (Elevate / Demote any role)",
      "ops_admin": "Full Control (Elevate / Demote any role)",
      "moderator": "Blocked from role changes",
      "support_agent": "Blocked from role changes",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/users (adminUpdateUserRole)",
      "Enforcement Layer": "Server Action Role Guard + Audit Log Emission"
    },
    {
      "Module / Feature Area": "User Verification & Reverification",
      "Detailed Capability / Action": "Approve verification status, reject with specific reason, or review reverification request messages",
      "super_admin": "Full Control (Approve / Reject)",
      "ops_admin": "Full Control (Approve / Reject)",
      "moderator": "Full Control (Approve / Reject)",
      "support_agent": "Read-Only (View Status)",
      "owner": "Blocked",
      "user": "Can submit reverification request",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/users (adminUpdateUserVerification)",
      "Enforcement Layer": "Server Action Guard (Requires write role)"
    },
    {
      "Module / Feature Area": "Vibe Upgrade Request Management",
      "Detailed Capability / Action": "Update status of listing vibe enhancement (requested -> in_progress -> completed -> cancelled)",
      "super_admin": "Full Control (Update Status)",
      "ops_admin": "Full Control (Update Status)",
      "moderator": "Full Control (Update Status)",
      "support_agent": "Read-Only (View Status)",
      "owner": "Can request upgrade for owned properties",
      "user": "Can request upgrade for flatmate listing",
      "tester": "Can request upgrade",
      "Route / Endpoint": "/admin/vibe-requests",
      "Enforcement Layer": "Server Action Role Check + Status Transition Validation"
    },
    {
      "Module / Feature Area": "Cities, Localities & POI Configuration",
      "Detailed Capability / Action": "Add, edit, deactivate Pune localities, metro stations, tech parks, and commute nodes",
      "super_admin": "Full Control (CRUD)",
      "ops_admin": "Full Control (CRUD)",
      "moderator": "Full Control (CRUD)",
      "support_agent": "Read-Only",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/cities",
      "Enforcement Layer": "Server Action Guard ('super_admin', 'ops_admin', 'moderator')"
    },
    {
      "Module / Feature Area": "Audit Logs & Security Stream",
      "Detailed Capability / Action": "Inspect chronological immutable event log of all backoffice operations, role changes, and system modifications",
      "super_admin": "Full Access (View / Filter by Actor & Action)",
      "ops_admin": "Full Access (View / Filter by Actor & Action)",
      "moderator": "Full Access (View / Filter by Actor & Action)",
      "support_agent": "Full Access (View / Filter by Actor & Action)",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/audit-logs",
      "Enforcement Layer": "Admin Layout Server Guard + Database Query"
    },
    {
      "Module / Feature Area": "Direct Property Inquiries & MSG91 SMS",
      "Detailed Capability / Action": "Log call/WhatsApp inquiries, send MSG91 Flow SMS to owner for interested buyers, and track inquiry volume",
      "super_admin": "Full Access",
      "ops_admin": "Full Access",
      "moderator": "Read-Only",
      "support_agent": "Read-Only",
      "owner": "Can view own incoming inquiry stats",
      "user": "Can initiate Call, WhatsApp, or SMS interest",
      "tester": "Can test direct contact actions",
      "Route / Endpoint": "/flat/[id] actions, /profile/properties",
      "Enforcement Layer": "Server Action Guard + Feature Flag (property_interest_sms)"
    },
    {
      "Module / Feature Area": "System Settings & Global Config",
      "Detailed Capability / Action": "Configure global platform settings, maintenance modes, contact numbers, and SLA parameters",
      "super_admin": "Full Control (Update Settings)",
      "ops_admin": "Full Control (Update Settings)",
      "moderator": "Read-Only",
      "support_agent": "Read-Only",
      "owner": "Blocked",
      "user": "Blocked",
      "tester": "Blocked",
      "Route / Endpoint": "/admin/settings",
      "Enforcement Layer": "Server Action Guard"
    },
    {
      "Module / Feature Area": "Property Listing Creation & Management",
      "Detailed Capability / Action": "Post new flats, upload room images, edit rent, deposit, furnishing status, and toggle availability",
      "super_admin": "Full Control (Any Property)",
      "ops_admin": "Full Control (Any Property)",
      "moderator": "Can edit / moderate flagged properties",
      "support_agent": "Read-Only",
      "owner": "Full Control (Own Properties Only)",
      "user": "Blocked from creating owner flats",
      "tester": "Can create test properties",
      "Route / Endpoint": "/owner/dashboard, /property/new",
      "Enforcement Layer": "Owner Session Check + Property Ownership Verification"
    },
    {
      "Module / Feature Area": "Seeker Profile & Compatibility Matrix",
      "Detailed Capability / Action": "Create flatmate seeker profile, set cleanliness, work shift, social vibe, food preference, and budget bounds",
      "super_admin": "Can moderate / edit any profile",
      "ops_admin": "Can moderate / edit any profile",
      "moderator": "Can moderate / edit any profile",
      "support_agent": "Read-Only",
      "owner": "Can view public seeker profiles",
      "user": "Full Control (Own Profile)",
      "tester": "Full Control (Own Profile)",
      "Route / Endpoint": "/profile, /seeker/edit, /search/flatmates",
      "Enforcement Layer": "User Session Check + Ownership Check"
    },
    {
      "Module / Feature Area": "Public Flat Search & Map Wizard",
      "Detailed Capability / Action": "Execute multi-parameter searches, view interactive map pins, filter by commute nodes, and view listing details",
      "super_admin": "Full Access",
      "ops_admin": "Full Access",
      "moderator": "Full Access",
      "support_agent": "Full Access",
      "owner": "Full Access",
      "user": "Full Access",
      "tester": "Full Access",
      "Route / Endpoint": "/search/flats, /flat/[id]",
      "Enforcement Layer": "Public Route + Non-blocking Telemetry Logging"
    },
    {
      "Module / Feature Area": "Facebook Locality Community CTA",
      "Detailed Capability / Action": "View and click dynamic Facebook group redirection modal across search results list",
      "super_admin": "Full Access",
      "ops_admin": "Full Access",
      "moderator": "Full Access",
      "support_agent": "Full Access",
      "owner": "Full Access",
      "user": "Full Access (Controlled by Feature Flag)",
      "tester": "Full Access",
      "Route / Endpoint": "/search/flats, /search/flatmates",
      "Enforcement Layer": "Client CTA Component + Feature Flag Check"
    }
  ];

  const wsMatrix = XLSX.utils.json_to_sheet(accessMatrixData);
  XLSX.utils.book_append_sheet(wb, wsMatrix, "Access_Control_Matrix");

  // ==========================================
  // SHEET 3: BACKOFFICE NAVIGATION & ROUTE DIRECTORY
  // ==========================================
  const backofficeRoutesData = [
    {
      "Module Name": "Dashboard Overview",
      "URL Path": "/admin",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "super_admin, ops_admin",
      "Key Capabilities": "Platform KPI snapshot, active listings ratio, listing views, connect inquiries, vibe upgrade status, recent operations stream, 7D demand summary card."
    },
    {
      "Module Name": "Demand Analytics",
      "URL Path": "/admin/demand-analytics",
      "Sidebar Visible Roles": "super_admin, ops_admin ONLY",
      "Read Access Roles": "super_admin, ops_admin ONLY",
      "Write / Mutation Roles": "N/A (Read-only analytics intelligence)",
      "Key Capabilities": "Real-time search telemetry, timeseries engagement velocity, locality demand ranking, supply shortage watchlist, BHK preferences, budget histogram, lifestyle matrix, live search feed."
    },
    {
      "Module Name": "Facebook Groups Management",
      "URL Path": "/admin/facebook-groups",
      "Sidebar Visible Roles": "super_admin, ops_admin ONLY",
      "Read Access Roles": "super_admin, ops_admin ONLY",
      "Write / Mutation Roles": "super_admin, ops_admin ONLY",
      "Key Capabilities": "Link Facebook group communities to Pune localities, manage group URLs, member counts, descriptions, and active statuses."
    },
    {
      "Module Name": "Cities & Localities",
      "URL Path": "/admin/cities",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "super_admin, ops_admin, moderator",
      "Key Capabilities": "Manage supported cities, residential localities, geo-coordinates, and commute destination points of interest (POIs)."
    },
    {
      "Module Name": "Users Management",
      "URL Path": "/admin/users",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "super_admin, ops_admin (Role Elevation) | moderator (Verification only)",
      "Key Capabilities": "List users, search by phone/email/role, update role dropdown, verify/reject identity, review reverification request messages."
    },
    {
      "Module Name": "Vibe Upgrade Requests",
      "URL Path": "/admin/vibe-requests",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "super_admin, ops_admin, moderator",
      "Key Capabilities": "Track property enhancement requests, assign photographer/stylist, update workflow status (requested, in_progress, completed, cancelled)."
    },
    {
      "Module Name": "Audit Logs",
      "URL Path": "/admin/audit-logs",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "System automated immutable writes",
      "Key Capabilities": "Immutable chronological trail of all admin operations, role elevation changes, property edits, and feature flag toggles."
    },
    {
      "Module Name": "Feature Management",
      "URL Path": "/admin/features",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "super_admin ONLY",
      "Key Capabilities": "Register new features, toggle status (active/inactive), set rollout percentage (0-100%), manage whitelisted user IDs, configure custom rule targeting."
    },
    {
      "Module Name": "System Config & Settings",
      "URL Path": "/admin/settings",
      "Sidebar Visible Roles": "super_admin, ops_admin, moderator, support_agent",
      "Read Access Roles": "super_admin, ops_admin, moderator, support_agent",
      "Write / Mutation Roles": "super_admin, ops_admin",
      "Key Capabilities": "Platform configuration parameters, support contact numbers, maintenance mode toggle, and caching options."
    }
  ];

  const wsRoutes = XLSX.utils.json_to_sheet(backofficeRoutesData);
  XLSX.utils.book_append_sheet(wb, wsRoutes, "Backoffice_Route_Directory");

  // ==========================================
  // SHEET 4: LIFECYCLE & MAINTENANCE GUIDE
  // ==========================================
  const lifecycleData = [
    {
      "Topic / Section": "1. Default User Registration",
      "Details & Business Logic": "When a new user signs up with mobile OTP, their role defaults to 'user' with verificationStatus = 'pending'.",
      "Code Reference": "src/models/User.ts, src/app/api/auth/verify-otp/route.ts"
    },
    {
      "Topic / Section": "2. Owner Role Assignment",
      "Details & Business Logic": "When a user posts their first property listing or registers as an owner, their role is set or updated to 'owner'.",
      "Code Reference": "src/models/User.ts, src/models/Property.ts"
    },
    {
      "Topic / Section": "3. Admin Elevation Workflow",
      "Details & Business Logic": "Only Super Admins and Operations Admins can elevate a user to 'super_admin', 'ops_admin', 'moderator', or 'support_agent' via the User Management table. Every elevation emits an immutable entry in AuditLog.",
      "Code Reference": "src/app/admin/users/actions.ts (adminUpdateUserRole), src/models/AuditLog.ts"
    },
    {
      "Topic / Section": "4. Strict Module Isolation Rules",
      "Details & Business Logic": "Demand Analytics (/admin/demand-analytics) and Facebook Groups (/admin/facebook-groups) are strictly restricted to 'super_admin' and 'ops_admin'. They are hidden from the sidebar and protected by server-side redirect guards for all other roles.",
      "Code Reference": "src/components/AdminLayout.tsx, src/app/admin/demand-analytics/page.tsx, src/app/admin/facebook-groups/page.tsx"
    },
    {
      "Topic / Section": "5. Feature Flag Governance",
      "Details & Business Logic": "Feature creation and toggling are restricted to 'super_admin' to prevent unauthorized release of beta functionality.",
      "Code Reference": "src/app/admin/features/actions.ts"
    },
    {
      "Topic / Section": "6. How to Add a New Role in Future",
      "Details & Business Logic": "Step 1: Update enum in src/models/User.ts. Step 2: Add role to NextAuth session types in src/types/next-auth.d.ts. Step 3: Configure route permissions in src/components/AdminLayout.tsx and relevant page/action guards. Step 4: Run 'npm run export:roles-matrix' to update this Excel file.",
      "Code Reference": "src/models/User.ts, src/components/AdminLayout.tsx, scripts/generate_roles_matrix.ts"
    }
  ];

  const wsLifecycle = XLSX.utils.json_to_sheet(lifecycleData);
  XLSX.utils.book_append_sheet(wb, wsLifecycle, "Lifecycle_And_Rules");

  // Adjust column widths automatically for clean readability
  [wsOverview, wsMatrix, wsRoutes, wsLifecycle].forEach((ws) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H20');
    const colWidths: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = 15;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          const str = cell.v.toString();
          if (str.length > maxLen) {
            maxLen = Math.min(str.length + 3, 50); // cap max width at 50 for clean wraps
          }
        }
      }
      colWidths.push({ wch: maxLen });
    }
    ws['!cols'] = colWidths;
  });

  // Write output file to docs directory
  const docsDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const docsFilePath = path.resolve(docsDir, 'FlatNFlatmates_Roles_and_Permissions_Matrix.xlsx');
  XLSX.writeFile(wb, docsFilePath);

  console.log(`Excel file successfully created at: ${docsFilePath}`);
}

createRolesMatrixWorkbook();
