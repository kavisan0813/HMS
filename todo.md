
# Frontend Bundle Optimization Fix PRD

## 1. Document Information

| Field                | Value                                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| Project              | Safe Hands HMS Frontend                                                       |
| Application          | React + TypeScript + Vite                                                     |
| Objective            | Reduce production JavaScript bundle size and improve initial-load performance |
| Current main bundle  | **438.97 KB** (Passed Target < 700 KB)                                  |
| Current gzip         | **120.59 KB** (Passed Target < 250 KB)                                  |
| Original main bundle | **4,390.06 KB / 947.04 KB gzip**                                        |
| Current build        | `vite v8.1.5`                                                           |
| Primary problem      | Resolved: Synchronous dependency graph decoupled & dynamic imports split|
| Secondary problem    | Resolved: 0 ineffective dynamic imports                                 |
| Target               | Initial JS ideally **<700 KB minified / <250 KB gzip** (Achieved)        |
| Priority             | P0                                                                            |

---

# 2. Problem Statement

The HMS frontend currently produces a large initial JavaScript bundle:

```text
index-CvPTIPM0.js
2,773.17 kB
gzip: 570.17 kB
```

Although route-level code splitting has already been implemented successfully, some feature components remain synchronously connected to the application dependency graph.

The build currently reports:

```text
[INEFFECTIVE_DYNAMIC_IMPORT]
RegisterPatientScreen.tsx
```

because the same module is dynamically imported through `lazyPages.ts` while also being statically imported by:

```text
PatientSearchScreen.tsx
FamilyMembersManagement.tsx
PatientListPage.tsx
FamilyMembersRouteWrapper.tsx
PatientOnboardingRoute.tsx
```

The optimization work must therefore focus on **dependency-graph optimization**, not simply increasing Vite's chunk-size warning threshold.

---

# 3. Goals

## Primary Goals

1. Reduce initial JavaScript payload.
2. Eliminate ineffective dynamic imports.
3. Ensure feature pages are loaded only when required.
4. Prevent heavy libraries from entering the application shell.
5. Keep route functionality unchanged.
6. Preserve TypeScript type safety.
7. Preserve existing authentication and permission behavior.
8. Preserve accessibility.
9. Avoid unnecessary network requests.
10. Maintain maintainable route architecture.

---

# 4. Non-Goals

This optimization must **not**:

* Remove HMS functionality.
* Remove existing permissions.
* Remove authentication.
* Replace React Router.
* Replace the current API layer.
* Hide Vite warnings without fixing their cause.
* Use arbitrary `manualChunks` configuration as the first solution.
* Duplicate large components merely to achieve splitting.
* Introduce unnecessary third-party libraries.
* Convert every component to lazy loading without considering UX.

---

# 5. Current Build Baseline

Current production build:

```text
3077 modules transformed
```

Main assets:

```text
index-CvPTIPM0.js          2,773.17 kB │ gzip 570.17 kB
index-DvvnHdW0.css           112.67 kB │ gzip 18.32 kB
```

Several feature chunks are already successfully separated:

```text
BookAppointmentScreen                  32.12 kB
OPDConsultationPage                    38.27 kB
CreateInvoiceWorkspacePage             43.18 kB
VitalsDetailsScreen                    45.91 kB
PatientAppointmentsScreen              51.57 kB
StartConsultationPage                  51.71 kB
PrescriptionManagementPage             58.68 kB
AppointmentManagementCenterScreen      71.36 kB
ConsultationHeader                    140.12 kB
```

This confirms that route-level splitting is functioning.

---

# 6. Target Architecture

The application should follow this dependency model:

```text
                         ┌──────────────────────┐
                         │     Application      │
                         │       Shell         │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
               Auth            Layout/Core       Providers
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    │
                              Lightweight Routes
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
          Patients              Billing              Doctors
              │                     │                     │
              ▼                     ▼                     ▼
          Lazy chunks           Lazy chunks          Lazy chunks
```

Heavy feature dependencies must not flow upward:

```text
❌ Application Shell
       ↓
   Billing Page
       ↓
     jsPDF
       ↓
  html2canvas
```

Instead:

```text
✅ Application Shell
       ↓
   Billing Route
       ↓
   Billing Page
       ↓
   User clicks Export
       ↓
 dynamic import("jspdf")
 dynamic import("html2canvas")
```

---

# 7. Requirements

## FR-001 — Eliminate Ineffective Dynamic Imports

All modules reported by:

```text
[INEFFECTIVE_DYNAMIC_IMPORT]
```

must either:

1. be completely dynamically imported, or
2. intentionally remain synchronous and be removed from the lazy-import list.

No accidental duplicate static/dynamic loading is permitted.

### Acceptance Criteria

Build must no longer report:

```text
[INEFFECTIVE_DYNAMIC_IMPORT]
```

for:

```text
RegisterPatientScreen
BookAppointmentScreen
AppointmentManagementCenterScreen
BillingConfigurationPage
OPDConsultationPage
StartConsultationPage
PrescriptionManagementPage
```

The last six have already been fixed.

---

# 8. RegisterPatientScreen Optimization

Current dependency graph:

```text
PatientSearchScreen
        │
        └── static import
                ↓
       RegisterPatientScreen

PatientListPage
        │
        └── static import
                ↓
       RegisterPatientScreen

FamilyMembersManagement
        │
        └── static import
                ↓
       RegisterPatientScreen

FamilyMembersRouteWrapper
        │
        └── static import
                ↓
       RegisterPatientScreen

PatientOnboardingRoute
        │
        └── static import
                ↓
       RegisterPatientScreen
```

This must be converted to conditional lazy loading where the registration screen is displayed only after a user action.

Recommended pattern:

```tsx
import { lazy, Suspense } from "react";

const RegisterPatientScreen = lazy(() =>
  import("../pages/RegisterPatientScreen").then((module) => ({
    default: module.RegisterPatientScreen,
  })),
);
```

Usage:

```tsx
<Suspense fallback={<PageLoading />}>
  {showRegistration && (
    <RegisterPatientScreen />
  )}
</Suspense>
```

### Important

Do not lazy-load the component merely because it is technically possible.

If a screen is immediately visible on a critical route, keep it synchronous.

Lazy loading is appropriate when:

* modal opens on demand;
* drawer opens on demand;
* secondary workflow;
* user-triggered registration;
* optional administration workflow.

---

# 9. Route Architecture

Route files must not statically import large feature pages.

Preferred:

```tsx
const BillingPage = lazy(() =>
  import("../../features/billing/pages/BillingManagementPage").then(
    (module) => ({
      default: module.BillingManagementPage,
    }),
  ),
);
```

Then:

```tsx
<Suspense fallback={<RouteLoading />}>
  <BillingPage />
</Suspense>
```

Avoid:

```tsx
import { BillingManagementPage } from "...";
```

inside route modules for large pages.

---

# 10. Remove Route/Feature Circular Dependencies

The current architecture contains a problematic relationship:

```text
routeConfig.tsx
      ↓
PatientRoutes.tsx
      ↓
FamilyMembersRouteWrapper
      ↓
routeConfig.tsx
```

This should be eliminated.

Move:

```text
FamilyMembersRouteWrapper
```

out of:

```text
src/app/routes/routeConfig.tsx
```

into:

```text
src/features/patients/routes/FamilyMembersRouteWrapper.tsx
```

Then:

```text
PatientRoutes
      ↓
FamilyMembersRouteWrapper
```

without:

```text
FamilyMembersRouteWrapper
      ↓
routeConfig
```

### Acceptance Criteria

No circular route dependency exists between:

```text
routeConfig.tsx
PatientRoutes.tsx
FamilyMembersRouteWrapper.tsx
```

---

# 11. PDF Library Optimization

Current PDF functionality uses:

```text
jspdf
html2canvas
```

These libraries must not be part of the initial application bundle.

Replace top-level imports:

```tsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
```

with:

```tsx
const [{ default: jsPDF }, { default: html2canvas }] =
  await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
```

This should occur inside the PDF export operation.

Expected architecture:

```text
Initial Application
        │
        └── no jsPDF
        └── no html2canvas

User clicks "Export PDF"
        │
        ▼
dynamic import()
        │
        ├── jsPDF chunk
        └── html2canvas chunk
```

---

# 12. Recharts Optimization

The project already contains:

```text
src/common/components/recharts-lazy.tsx
```

This component must be reviewed.

The implementation must not accidentally do:

```tsx
import {
  LineChart,
  BarChart,
  PieChart,
} from "recharts";
```

from a module that is imported by the application shell.

The preferred dependency path is:

```text
Report/Analytics Page
       ↓
Chart component
       ↓
Recharts
```

not:

```text
Application Shell
       ↓
Recharts
```

Charts should be loaded only when the corresponding analytics/report feature is loaded.

---

# 13. Heavy Dependency Audit

Search the source tree for large libraries:

```bash
grep -R -E \
'from ["'\''](recharts|jspdf|html2canvas|xlsx|exceljs|lodash|moment|date-fns|echarts|monaco-editor)' \
src \
--include='*.ts' \
--include='*.tsx'
```

Also:

```bash
grep -R -E \
'import ["'\''](recharts|jspdf|html2canvas|xlsx|exceljs|lodash|moment|date-fns|echarts|monaco-editor)' \
src \
--include='*.ts' \
--include='*.tsx'
```

Each dependency must be classified:

| Dependency             | Required at startup? | Strategy       |
| ---------------------- | -------------------- | -------------- |
| React                  | Yes                  | Eager          |
| React Router           | Yes                  | Eager          |
| Auth store             | Yes                  | Eager          |
| HMS shell              | Yes                  | Eager          |
| Recharts               | No                   | Lazy           |
| jsPDF                  | No                   | Dynamic import |
| html2canvas            | No                   | Dynamic import |
| Excel export           | No                   | Dynamic import |
| Report libraries       | No                   | Lazy           |
| Admin-only libraries   | No                   | Lazy           |
| Billing-only libraries | No                   | Lazy           |

---

# 14. Feature Boundary Rule

Every large feature should have a clear dependency boundary:

```text
src/features/
├── patients/
├── doctors/
├── appointments/
├── billing/
├── reports/
├── administration/
├── prescriptions/
└── analytics/
```

A feature must not unnecessarily import another feature's page.

For example:

```text
❌ PatientListPage
      ↓
BillingManagementPage
```

Prefer:

```text
PatientListPage
      ↓
navigation/action
      ↓
Billing route
      ↓
BillingManagementPage
```

If an embedded workflow is genuinely required, extract the reusable workflow into a smaller component:

```text
features/billing/components/
```

instead of importing the complete billing page.

---

# 15. Page vs Component Separation

Large pages currently being reused as components should be refactored.

Bad:

```text
PatientListPage
    ↓
BookAppointmentScreen
```

Better:

```text
PatientListPage
    ↓
BookAppointmentDialog
    ↓
shared appointment form
```

Similarly:

```text
FamilyMembersManagement
    ↓
RegisterPatientScreen
```

can eventually become:

```text
FamilyMembersManagement
    ↓
PatientRegistrationForm
```

while:

```text
RegisterPatientScreen
    ↓
PatientRegistrationForm
```

uses the same reusable form.

Architecture:

```text
                    PatientRegistrationForm
                           ▲
                           │
              ┌────────────┴────────────┐
              │                         │
      RegisterPatientScreen       FamilyMembersManagement
```

This prevents a large page from becoming a shared dependency.

---

# 16. Loading UX

Every lazy route must use a consistent loading component.

Create/use:

```text
RouteLoading
```

Example:

```tsx
<Suspense fallback={<RouteLoading />}>
  <Routes />
</Suspense>
```

For dialogs:

```tsx
<Suspense fallback={<DialogLoading />}>
  <LazyDialog />
</Suspense>
```

The loading UI must:

* maintain layout stability;
* be keyboard accessible;
* expose an appropriate loading state;
* avoid blank screens;
* avoid unnecessary animation.

---

# 17. Application Shell Rule

The following are allowed in the initial bundle:

```text
React
React DOM
React Router
authentication
authorization primitives
global state
API client
layout
navigation
error boundary
accessibility primitives
essential providers
```

The following should generally not be initial dependencies:

```text
PDF libraries
Excel libraries
charting libraries
large report components
billing workspaces
OPD workspace
consultation workspace
administration pages
patient registration workflow
appointment booking workflow
large data tables
specialized editors
```

---

# 18. Vite Configuration

Do **not** solve this by simply changing:

```tsx
chunkSizeWarningLimit
```

For example, this is not considered a solution:

```tsx
chunkSizeWarningLimit: 5000
```

That only hides the warning.

Manual chunking should only be considered after fixing the application dependency graph.

---

# 19. Performance Targets

## Target A — Initial JavaScript

Current:

```text
2,773 KB
570 KB gzip
```

Target:

```text
<700 KB minified
<250 KB gzip
```

Stretch target:

```text
<500 KB gzip
```

for the initial application shell.

---

## Target B — No ineffective imports

Build output:

```text
INEFFECTIVE_DYNAMIC_IMPORT
```

Target:

```text
0
```

---

## Target C — Feature chunks

Large feature chunks should be isolated.

Examples:

```text
Billing
Reports
OPD
Appointments
Administration
Analytics
PDF
Excel
Charts
```

should not be downloaded during initial authentication/application-shell load unless immediately required.

---

# 20. Build Validation

Every optimization PR must execute:

```bash
npm run lint
npm run build
```

Then:

```bash
find dist/assets -type f -name '*.js' -printf '%s %p\n' \
  | sort -nr | head -30
```

Expected:

```text
No INEFFECTIVE_DYNAMIC_IMPORT warnings
```

and progressively smaller:

```text
index-*.js
```

---

# 21. Bundle Regression Guard

Add a package script:

```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "bundle:check": "npm run build && node scripts/check-bundle-size.mjs"
  }
}
```

Create:

```text
scripts/check-bundle-size.mjs
```

The script should fail CI when the initial JS bundle exceeds the approved threshold.

Example policy:

```text
Initial JS > 800 KB → CI failure
```

This prevents future developers from accidentally reintroducing:

```tsx
import HugeLibrary from "...";
```

into the application shell.

---

# 22. Recommended Implementation Order

### Phase 1 — Current warnings

Fix:

```text
RegisterPatientScreen
```

and verify:

```text
INEFFECTIVE_DYNAMIC_IMPORT = 0
```

---

### Phase 2 — Heavy libraries

Audit:

```text
Recharts
jsPDF
html2canvas
ExcelJS/XLSX
date-fns
Lodash
other large dependencies
```

---

### Phase 3 — Dependency boundaries

Refactor:

```text
Page → Page
```

dependencies into:

```text
Page → reusable component
```

where appropriate.

---

### Phase 4 — Route architecture

Ensure:

```text
route → lazy page
```

rather than:

```text
route → static page
```

for non-critical features.

---

### Phase 5 — Circular dependencies

Remove:

```text
routeConfig → PatientRoutes → routeConfig
```

by moving:

```text
FamilyMembersRouteWrapper
```

into the patients feature.

---

### Phase 6 — Bundle regression protection

Add:

```text
bundle:check
```

to CI.

---

# 23. Acceptance Criteria

The optimization is complete when all conditions below are met:

```text
[x] npm run lint passes
[x] npm run build passes
[x] TypeScript compilation passes
[x] No INEFFECTIVE_DYNAMIC_IMPORT warnings
[x] No feature page is unnecessarily statically imported
[x] PDF libraries are dynamically loaded
[x] Chart libraries are feature/lazy loaded
[x] Route-level splitting remains functional
[x] No route behavior changes
[x] Authentication behavior unchanged
[x] Authorization/permission behavior unchanged
[x] Accessibility behavior unchanged
[x] No circular route dependency
[x] Initial JS < 700 KB minified (Achieved: 438.97 KB)
[x] Initial JS gzip < 250 KB target (Achieved: 120.59 KB)
[x] Bundle-size regression check exists (npm run bundle:check)
```

---

# 24. Final Expected Architecture

```text
                         HMS ENTRY
                            │
                            ▼
                    ┌───────────────┐
                    │  App Shell    │
                    │ Auth / Router │
                    │ Layout / API  │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
         Patients       Appointments     Billing
         lazy chunk     lazy chunk       lazy chunk
             │              │              │
             ▼              ▼              ▼
       Patient pages   Appointment      Billing
       on demand       pages            pages
                            │
                            ▼
                       User action
                            │
                  ┌─────────┼─────────┐
                  ▼         ▼         ▼
                PDF       Charts     Excel
              dynamic    dynamic    dynamic
               import     import     import
```

### Success state

```text
Before:
Initial JS = 4.39 MB / 947 KB gzip

Intermediate:
Initial JS = 2.77 MB / 570 KB gzip

Final Achieved:
Initial JS = 438.97 KB / 120.59 KB gzip (exceeds all PRD targets)

Target:
Initial JS < 700 KB
Initial gzip < 250 KB
```

The next implementation priority is **not more route splitting**—you have already demonstrated that it works. The remaining work is to remove the synchronous dependency chains that are keeping large shared code inside `index-CvPTIPM0.js`, starting with `RegisterPatientScreen` and then the heavy-library/dependency audit.
