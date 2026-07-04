# ANTF Punjab — Node.js + React Rebuild — Foundation

This is Milestone 1 of the full rewrite: project scaffolding, database connection layer, and authentication — verified to build and run cleanly.

## What's in here

```
backend/
  src/
    db/pool.js              - SQL Server connection pool + generic stored-proc executor
    db/GetUserForAuth.sql   - new stored proc for login (no plaintext logging)
    middleware/auth.js      - JWT verification + role-based access control
    routes/auth.js          - POST /api/auth/login
    server.js               - Express app entry point
  scripts/migratePasswords.js - one-time bcrypt migration (see below)
  .env.example

frontend/
  src/
    api/client.js           - Axios instance, auto-attaches JWT, handles 401s
    context/AuthContext.jsx - replaces ASP.NET Session state
    components/ProtectedRoute.jsx
    pages/Login.jsx          - replaces Login.aspx
    App.jsx                  - router shell with placeholder routes for every
                                page we still need to build
```

## Two security issues found and fixed in this rewrite

While building the new login flow, I found the current .NET app:
1. **Compares passwords in plaintext** (`WHERE ...AND Password=@Password` directly in SQL, and `ds.Tables[0].Rows[0]["password"].ToString() == txtpassword.Text` in code)
2. **Logs the plaintext password on every login attempt** into `tblReceiveLog` (`'UserName:'+@UserName+'-Password:'+@Password`)

The new backend uses **bcrypt** hashing and comparison, and never logs a password anywhere. `GetUserForAuth.sql` is a new, minimal stored procedure that only returns the stored hash for Node to check — it does no password logging or comparison in SQL at all.

## Setup instructions

### 1. Database
Run `backend/src/db/GetUserForAuth.sql` against your database (additive — doesn't remove or break the existing `ValidateUser` proc, so the old .NET app keeps working until you're ready to fully cut over).

### 2. Backend
```
cd backend
npm install
cp .env.example .env
# fill in DB_PASSWORD and a random JWT_SECRET in .env
node scripts/migratePasswords.js   # ONE-TIME: hashes existing plaintext passwords
npm install -g nodemon             # optional, for auto-restart during dev
node src/server.js                 # or: nodemon src/server.js
```

**Important:** `migratePasswords.js` widens `tblContact.Password` from `VARCHAR(30)` to `VARCHAR(200)` (bcrypt hashes are 60 characters, the old column would truncate and corrupt them). This is a **one-way, one-time operation** — once run, the *old* ASP.NET login will stop working, since it still does a plaintext string comparison against what is now a hash. Do not run this against your live production data until the new frontend is ready to fully replace the old login page. Test it against a copy of the database first.

### 3. Frontend
```
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173/login`. Vite is configured to proxy `/api` requests to `http://localhost:4000`, where the backend runs.

## Feature Parity Audit (full page-by-page comparison)

The old app has 24 pages (excluding the 2 webhooks, which are done). Here's the complete status after this pass:

| Old page | Status | New route |
|---|---|---|
| Login.aspx | ✅ Done | `/login` |
| Logout.aspx | ✅ Done | handled in AuthContext |
| Dashboard.aspx | ✅ Done | `/dashboard` |
| ViewRequest.aspx | ✅ Done | `/view-request` |
| Close.aspx | ✅ Done (full CR) | `/close-status/:id` |
| ReportDistrictWise.aspx | ✅ Done | `/reports/district-wise` |
| ReportDistrictWiseAbstract.aspx | ✅ Done | `/reports/district-wise-abstract?isVdc=0` |
| ReportDistrictWiseVDCAbstract.aspx | ✅ Done | `/reports/district-wise-abstract?isVdc=1` |
| ReportComplaintWiseDetail.aspx | ✅ Done | `/reports/complaint-detail` |
| ReportVDCAbstractDetail.aspx | ✅ Done | `/reports/vdc-abstract-detail` |
| AEEmployee.aspx | ✅ Done | `/employees/new`, `/employees/:id` |
| ViewEmployee.aspx | ✅ Done | `/employees` |
| MobileListener.aspx | ✅ Done | `/MobileListener.aspx` |
| B2BWebService.aspx | ✅ Done | `/B2BWebService.aspx` |
| **Abstract.aspx** | ✅ Done this pass | `/abstract` |
| **MyAccount.aspx** | ✅ Done this pass | `/my-account` |
| **ChangePassword.aspx** | ✅ Done this pass | `/change-password` |
| **Forward.aspx** | ✅ Done this pass | `/forward/:id` |
| **Return.aspx** | ✅ Done this pass | `/return/:id` |
| **Reopen.aspx** | ✅ Done this pass | `/reopen/:id` |
| **UpdateFIRNo.aspx** | ✅ Done this pass | `/update-fir/:id` |
| **NoPage.aspx** | ✅ Done this pass | catch-all 404 route |
| **AEInfo.aspx** | ✅ Done this pass | `/ae-info/:id` |
| **AESubstance.aspx** | ✅ Done this pass | `/add-substance/:id` |
| **ViewSubstance.aspx** | ✅ Done this pass | `/view-substance/:id` |
| **ViewDetail.aspx** | ✅ Done this pass | `/view-detail/:id` |
| **ViewRequestAll.aspx** | ✅ Done this pass | `/view-request-all` |

## What this pass actually fixed

Previously, several buttons in View Request were **dead links** — Forward, Action (Return), ReOpen, and the FIR Number link all pointed at routes that didn't exist. Those are now fully wired end-to-end (frontend page + backend route + real stored proc calls), so the core "act on a complaint" workflow is no longer broken partway through.

Also fixed along the way:
- **Change Password** now checks the old password's bcrypt hash against the database directly, rather than the old app's approach of comparing against a plaintext copy kept in server-side session state
- **View Request** now reads `?s=` and `?i=` query params on load, restoring the deep-link behavior the old app used from Dashboard/Abstract/MyAccount's summary links

## What's genuinely still missing (in priority order for next pass)

## All 24 pages are now accounted for

That closes out the full page-by-page audit — every page in the original app has a working equivalent in the rebuild.

**What was built in this final pass:**
- **AEInfo.aspx → `/ae-info/:id`** — turned out to be much smaller in scope than its category-conditional complaint-intake cousin (`MobileListener`'s method 5): it's just a category/subcategory/district reclassification form, calling `UpdateInfo`.
- **AESubstance.aspx → `/add-substance/:id`** — dynamic add/remove rows for substance seizure records (substance, quantity, MI/GM multi-substance flag). The original built pipe-delimited parallel string arrays from GridView rows to pass to `InsertSubstance`; the rebuild sends a proper JSON array from the frontend and builds those pipe-delimited strings server-side, so the quirky wire format doesn't leak into the UI code.
- **ViewSubstance.aspx → `/view-substance/:id`** — read-only substance list, calls `GetSubstance`.
- **ViewRequestAll.aspx → `/view-request-all`** — the admin-wide, non-contact-scoped request list with free-text search and pagination, calling `GetRequestListall`. Abstract's drill-down links now correctly point here instead of the interim `/view-request` substitute from the previous pass.

**One real gap caught and fixed while doing this pass:** while adapting View Request's rendering logic for View Request All, I noticed the original app always showed "Add / View Substance" links on every closed complaint row (`Cells[24]`), completely unrelated to the row-action buttons (Forward/Close/Return/Reopen) — and this had been missed when View Request was first built. Fixed in both `viewRequest.js` and the new `viewRequestAll.js` via a shared `showsSubstanceLinks()` helper, and the missing links are now rendered in both pages' tables.

**Also refactored:** the row-action computation logic (`computeRowAction`) was originally only in `viewRequest.js`; since `ViewRequestAll` needed the identical logic, it's now extracted to `src/utils/rowActions.js` and imported by both routes — so the two list pages can't silently drift apart on what actions a given role sees.

## ViewDetail.aspx — how it was rebuilt

This was the largest single gap (730 lines in the original) and every "Information ID" link across the entire app points here, so it was the right thing to prioritize. Rather than hand-transcribing ~50 near-identical "show this row only if the field has a value" conditional blocks, I extracted the full list of ~80 fields the original could display (verified against `GetInfo`'s actual `SELECT` column aliases in the stored procedure, not guessed), and built a generic renderer: a field is grouped under its category (Dealer, Substance, FIR, Addict, Victim, Suspect, Volunteer, etc.) and only shown when it has a value — which reproduces the original's category-conditional display exactly, since irrelevant fields for a given complaint category are simply blank in the data. Also includes the "Update History" audit trail table (the second result set `GetInfo` returns) with file-type icons, matching the original's file-icon-by-extension logic used elsewhere in the app.

## What's next (in order)
1. ~~Close Status page~~ ✅ done
2. ~~Dashboard + View Request~~ ✅ done
3. ~~Reports~~ ✅ done
4. ~~Employee/Admin management~~ ✅ done
5. ~~WhatsApp bot webhook endpoints~~ ✅ done (see below) — **read this one before anything else**

All 5 planned milestones are complete. This is the full application, front to back.

## ⚠️ Milestone 6: WhatsApp webhooks — done, but read the security notes first

**This milestone found a live, currently-active vulnerability in your production system, independent of this rewrite.** `MobileListener.aspx.cs` (the mobile app / WhatsApp integration API) contains this in its signature-check function:

```csharp
if (v == "gurpreet") { r.sts = true; return r; }
```

This is a **hardcoded bypass string**. Every method on this endpoint — including submitting a complaint and closing one — normally requires a signed, time-limited token, but anyone who sends `v=gurpreet` skips that check entirely and can call any method with no authentication at all. This is in your **currently deployed, currently running** application, not something introduced by this rewrite. I'd escalate this immediately and get that one line removed from the live `.aspx.cs`, regardless of whether or when this Node rewrite ships.

Two more issues found and fixed in the rewrite (lower severity, but worth knowing about):
- The AES key and IV used for that signature check were hardcoded as byte arrays directly in the `.cs` source. Moved to environment variables (`MOBILE_AUTH_KEY` / `MOBILE_AUTH_IV` in `.env.example`) — **get the real values from whoever manages the mobile app/Karix side**, don't generate new ones, or every existing signed request will stop validating.
- `B2BWebService.aspx.cs` (outbound WhatsApp sender) had `ServerCertificateValidationCallback = delegate { return true; }` — this disables TLS certificate validation entirely, meaning it would accept literally any certificate, valid or not. Removed in the rewrite. It also had the gateway's Bearer token hardcoded in source; moved to `WHATSAPP_GATEWAY_TOKEN`.

**One architectural thing that affects deployment, not just code:** `B2BWebService.aspx` isn't called by your frontend at all — it's triggered **directly by SQL Server**. The `CloseStatus` stored procedure ends with `EXECUTE HttpRequest @Url`, where `@Url` is hardcoded to `https://police.pragyaware.com/B2BWebService.aspx?...`. That means the WhatsApp confirmation message flow is decoupled from whatever web app is running — SQL Server calls that exact URL directly. For this to keep working with zero database changes, **the Node app must be reachable at that exact domain/path** once deployed (I mounted it at `/B2BWebService.aspx`, not under `/api`, specifically for this reason). If this app ends up on a different domain, either update the stored procedure's `@BaseUrl` or add a redirect — otherwise complaints will still close successfully, but citizens will silently stop getting their WhatsApp confirmation, which is an easy thing to not notice until much later.

**Backend files:**
- `backend/src/utils/mobileAuth.js` — the fixed signature validation (no backdoor)
- `backend/src/routes/mobileListener.js` — all 10 methods (login, get employee list, get request list, update status, submit WhatsApp complaint, get district/police station/lists, add file), mounted at `/MobileListener.aspx` for backward compatibility with existing callers
- `backend/src/routes/notifications.js` — the outbound WhatsApp sender, mounted at `/B2BWebService.aspx`

**Verified, not just written:** I round-trip tested the AES-128-CBC decryption logic against the exact key/IV bytes from the old C# code (encrypt with those bytes, decrypt with the new Node code, confirm it matches) — the crypto parameters are correct. What I could **not** test is a real signed token from an actual Karix/mobile-app request, since I don't have one — recommend testing against a real request before cutover.

**Method 5 (WhatsApp complaint submission)** takes ~100 fields matching the wide `tblInfo` table — ported as a field-name array mapped mechanically to SQL parameters, same behavior as the old code (checks presence, not type, before forwarding to SQL).

## Milestone 5: Employee/Admin management — done



**Backend** (`backend/src/routes/employees.js`) — every route here requires `DesignationID === 1` (Admin), enforced via `requireRole([1])` middleware, matching the old page-level `Session["DesignationID"] != "1"` redirect:
- `GET /api/employees` — search/list (calls `GetEmployeeList`)
- `DELETE /api/employees` — bulk delete by ID array (calls `DeleteRecord` per ID, replacing the old checkbox-loop)
- `GET /api/employees/meta/designations`, `/meta/office-types`, `/meta/offices` — dropdown data, including the **4-level office hierarchy cascade** (Division → District → Tehsil → Village, all via the generic `GetOffice` proc with `@ParentID`/`@Type`)
- `GET/POST/PUT /api/employees/:id` — load/create/update (calls `GetEmployeeInfo`, `InsertEmployee`, `UpdateEmployee`)

**Frontend** (`EmployeeList.jsx`, `EmployeeForm.jsx`):
- List page with search filters and bulk-select-and-delete checkboxes
- Form replicates the old page's conditional field visibility exactly: which of Division/District/Tehsil/Village show up (and become required) depends on the selected Office Type, cascading via React Query the same way Close Status's FIR District → Police Station does

**Not carried forward:** the "Map to FPS" (Food Inspector ↔ Fair Price Shop mapping) feature. The old code for it (`drpFps`, `GetFPS` proc) was already commented out/dead in the source I was given — I left it as a placeholder link rather than resurrecting unused functionality. If this is actually still needed, let me know and I'll build it properly rather than guessing at its original intent from commented-out code.

## Milestone 4: Reports — done

Four report pages, all in `backend/src/routes/reports.js` + 4 matching frontend pages:

| Old page | New route | Stored proc |
|---|---|---|
| `ReportDistrictWise.aspx` | `/reports/district-wise` | `ReportDistrictWise` (has our CR's `@ActionResult` filter) |
| `ReportDistrictWiseAbstract.aspx` | `/reports/district-wise-abstract?isVdc=0` | `ReportDistrictWiseAbstract` |
| `ReportDistrictWiseVDCAbstract.aspx` | `/reports/district-wise-abstract?isVdc=1` | `ReportDistrictWiseVDCAbstract` |
| `ReportComplaintWiseDetail.aspx` | `/reports/complaint-detail` | `GetComplaintStatusWiseDetail` |
| `ReportVDCAbstractDetail.aspx` | `/reports/vdc-abstract-detail` | `GetVDCAbstractDetail` |

Same pattern as View Request: the old code decided which cells become clickable drill-down links via hardcoded `Cells[x]` indices and string concatenation into raw HTML. Replaced with structured `_openLink` / `_closedLink` / `_links` objects computed server-side, rendered as real React Router `<Link>` elements on the frontend — so drill-down URLs are built consistently and column reordering can't silently break a link.

**Note on Excel export:** the old app's export button used a manual "wrap a `DataTable` in HTML and save it with a `.xls` extension" trick (`GenerateExcel1`) rather than a real Excel library. I haven't rebuilt export yet for any of the report pages — worth doing as a small follow-up using a proper library (`exceljs`) rather than porting that trick forward, since it's cleaner and produces an actual `.xlsx` file, not just HTML with an Excel-flavored extension.

## Milestone 3: Dashboard + View Request — done

**View Request** (`backend/src/routes/viewRequest.js`, `frontend/src/pages/ViewRequest.jsx`):

This page's old code-behind decided what action links to show per row using **hardcoded GridView cell indices** (`Cells[4]`, `Cells[24]`, etc.) with a long chain of `DesignationID`/`IsANTF`/`AllotedTo` conditionals baked into raw HTML strings. I ported the *business rules* faithfully but restructured them into a single named function, `computeRowAction()`, that returns structured data (`{ type: 'forward_close' }`, `{ type: 'reopen' }`, etc.) instead of HTML — the frontend then renders real React elements from that. This means:
- The logic is unit-testable in isolation (pure function, row + user in, action type out)
- A future column reorder can't silently break which cell gets which link (the old failure mode)
- No `dangerouslySetInnerHTML` needed anywhere

**Worth a careful review pass:** this permission logic is dense (nested conditions on DesignationID 3/4/5, IsANTF, AllotedTo, DepartmentID, IsReopen) and I ported it by reading the C# rather than testing against live data. Recommend clicking through View Request as a few different user roles once this is running against your real database, to confirm each role sees exactly the actions it should.

**Dashboard** (`backend/src/routes/dashboard.js`, `frontend/src/pages/Dashboard.jsx`):

Straightforward port — calls the same `Dashboard` stored procedure (3 result sets: summary counts, district breakdown, category breakdown). The old page injected Google Charts via server-built `<script>` strings; replaced with **Recharts** stacked bar charts, which is both cleaner and removes a dependency on loading Google's charting library from a CDN.

## Milestone 2: Close Status page — done

**Backend** (`backend/src/routes/closeStatus.js`):
- `GET /api/close-status/:id` — complaint details + current status (calls `GetInfo`)
- `GET /api/close-status/districts` — for the FIR District dropdown (calls `GetDistrict`)
- `GET /api/close-status/police-stations/:districtId` — cascading dropdown (calls `GetPoliceStation`)
- `POST /api/close-status/:id` — submits the close action (calls `CloseStatus`), handles file upload via Multer (same `Attachment/<year>/<month>/` folder convention as the old app, same extension whitelist: jpg/jpeg/png/pdf/mpg/mpeg/mp4)

All 5 CR behaviors are implemented and validated **server-side** (not just in the UI, so a malformed/tampered request can't bypass the rules):
- Action Result dropdown required when Status = Action Taken
- "FIR Registered" option only accepted when IS FIR = Yes
- Canned Remarks required for Spam/Incomplete/Not Verifiable/Action Taken statuses, "Other" requires free text
- FIR Date, Accused Count, District, and Police Station all required together when IS FIR = Yes

**Frontend** (`frontend/src/pages/CloseStatus.jsx` + `frontend/src/hooks/useCloseStatus.js`):
- Single form component replicating every conditional show/hide rule from the old `Close.aspx` JavaScript, but as normal React state instead of jQuery DOM manipulation
- District → Police Station cascade uses React Query, refetches automatically when District changes
- File upload via native `<input type="file">` + `FormData`, no more WebForms `FileUpload` control

**Note on `GetInfo`:** this stored procedure returns a *very* wide row — `tblInfo` is a single shared table backing many different complaint categories (drug dealing, overdose deaths, rehab center complaints, volunteer suggestions, etc.), so most fields are null depending on category. I'm passing the full row to the frontend as-is for now; building a clean "show only the relevant fields for this complaint's category" summary view is worth doing as a follow-up, but wasn't in scope for getting this page functionally complete first.

## Design decisions worth knowing about
- **Business logic stays in SQL, for now.** Every existing stored procedure (`CloseStatus`, `GetRequestList`, `ReportDistrictWise`, etc.) gets reused as-is from the new backend — I'm not rewriting the SQL logic itself, just the application layer calling it. This is the single biggest risk-reducer for a system already holding real complaint/informant data: your business rules stay exactly as tested, only the framework around them changes.
- **JWT instead of server-side Session.** The old app kept ~13 pieces of user state in `Session[...]` (DesignationID, DistrictID, IsANTF, etc.) — all of that now lives in the JWT payload itself, so any backend instance can validate a request without shared session storage.
