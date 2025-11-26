# Development Plan: ACCESS QA Bot Wrapper

## 🌅 Next Session (Tomorrow Morning)

### Step 1: Move flow-helpers to qa-bot-core
**Location:** `qa-bot-core` repo

**What to move:**
- `resolveFlow()` function
- `resolveStep()` function
- Types: `FlowInput`, `FlowStep`, `FlowStepInput`, `ChatState`, `FlowPath`

**Consider:** Should the smart defaults be baked into the core's flow processing instead of requiring wrapper developers to call `resolveFlow()`? (Option B from discussion)

**Files in core to modify:**
- `src/index.ts` (export new helpers)
- New: `src/utils/flow-helpers.ts` or integrate into existing flow logic

### Step 2: Publish qa-bot-core beta
```bash
# In qa-bot-core repo
npm version prerelease --preid=beta
npm publish --tag beta
```

### Step 3: Update access-qa-bot to use core helpers
```bash
# In access-qa-bot repo
npm install @snf/qa-bot-core@beta
```

**Then:**
- Remove `src/utils/flow-helpers.ts` from this repo
- Update imports in all flows to use `@snf/qa-bot-core`
- Verify everything still works

### Step 4: Manual architecture review
- [ ] Review flow structure - is it clean and maintainable?
- [ ] Review types - are they exported correctly from core?
- [ ] Review wrapper developer experience - is it easy to add new flows?
- [ ] Check for any duplication between repos

### Step 5: Continue with remaining flows
After architecture is solid, proceed to **General Help Flow** (see below).

---

## Current Status

### ✅ Completed

| Phase | Description | Notes |
|-------|-------------|-------|
| **Phase 1: User Context** | User info in flows | Props flow through `AccessQABot` → `UserInfo` → `flow-context.ts`. Skips form fields when data available. |
| **Phase 2: File Attachments** | Upload component | Implemented in `@snf/qa-bot-core`. Imported as `FileUploadComponent`. |
| **Phase 4: ACCESS Login Flow** | 10-step ticket flow | Full flow with file upload, validation, summary, JIRA submission. |
| **Phase 4: Resource Login Flow** | 12-step ticket flow | Full flow for affiliated resource login issues. Uses `loginProvider` ticket type. |
| **Phase 6: Main Menu** | Navigation | Routes between Q&A and ticket flows. |
| **Infrastructure** | Build system, types, API | ESM/UMD/Standalone builds, TypeScript definitions, ticket API with Netlify proxy. |
| **Flow Helpers** | Smart defaults | `resolveFlow()` auto-detects `chatDisabled` based on options. (To be moved to core) |

### ❌ Remaining

| Phase | Description | Priority |
|-------|-------------|----------|
| **General Help Flow** | Multi-step general help ticket | High |
| **Security Incident Flow** | 8-step security reporting | Medium |
| **Metrics/XDMoD Flow** | Usage and performance queries | Low |
| **Feedback Flow** | General feedback collection | Low |

---

## Next Flow: General Help Flow

**Goal:** Implement the general-purpose help ticket flow.

**Request Type ID:** 17 (SUPPORT)

**Steps:**
1. Describe the issue (text input)
2. Does this involve a specific resource? (yes/no)
3. If yes: Which resource? + username at resource
4. Category/keyword selection
5. Attachment? (yes/no)
6. File upload (conditional)
7. Email (if not provided)
8. Name (if not provided)
9. ACCESS ID (optional)
10. Summary + confirmation
11. Success/error message

**Files to create:**
- `src/flows/general-help-flow.tsx`

**Files to modify:**
- `src/flows/ticket-flow.ts` (wire up "Another question" option)

**Estimated time:** 3-4 hours (patterns now well established)

---

## Then: Security Incident Flow

**Goal:** 8-step security incident reporting.

**Request Type ID:** 26 (SECURITY)

**Endpoint:** `/api/v1/security-incidents` (already configured in ticket-api.ts)

**Steps:**
1. Brief summary of incident
2. Priority selection (Critical/High/Medium/Low)
3. Detailed description
4. When did this occur?
5. Attachment? (yes/no)
6. File upload (conditional)
7. Contact info verification
8. Summary + confirmation
9. Success/error message

**Files to create:**
- `src/flows/security-flow.tsx`

**Files to modify:**
- `src/flows/main-menu-flow.ts` (add "Report a security issue" option)

**Estimated time:** 2-3 hours

---

## Later: Metrics/XDMoD Flow

**Goal:** Usage and performance queries via XDMoD API.

**Tasks:**
- Similar to Q&A flow but different endpoint
- API integration with metrics endpoint
- Feedback collection

**Files to create:**
- `src/flows/metrics-flow.ts`

**Estimated time:** 3-4 hours

---

## Later: Feedback Flow

**Goal:** General feedback collection (not Q&A specific).

**Tasks:**
- Multi-step feedback collection
- Role selection
- File uploads
- Community involvement questions
- Anonymous or identified submission

**Files to create:**
- `src/flows/feedback-flow.tsx`

**Estimated time:** 3-4 hours

---

## Final: Testing & Documentation

**Phase 9: Testing**
- Integration testing with access-ci-ui
- Test all flows end-to-end
- Verify API submissions work
- Cross-browser testing

**Phase 10: Documentation**
- Complete API documentation
- Usage examples for all flows
- Publish to npm as @snf/access-qa-bot@3.0.0

**Estimated time:** 6-8 hours combined

---

## Revised Estimates

| Phase | Estimate |
|-------|----------|
| Move flow-helpers to core + publish | 1-2 hours |
| General Help Flow | 3-4 hours |
| Security Incident Flow | 2-3 hours |
| Metrics/XDMoD Flow | 3-4 hours |
| Feedback Flow | 3-4 hours |
| Testing & Documentation | 6-8 hours |
| **Total Remaining** | **~19-25 hours** |

---

## Architecture Notes

### Flow Helpers (To Be Moved to Core)
Currently in `src/utils/flow-helpers.ts`. Provides:
- `resolveFlow(flow)` - applies smart defaults to all steps
- `resolveStep(step)` - auto-detects `chatDisabled`:
  - Has `options` or `checkboxes` → `chatDisabled: true`
  - No options → `chatDisabled: false`

**Decision pending:** Should this be baked into qa-bot-core's flow processing (automatic) or remain as an explicit helper function (opt-in)?

### User Context Implementation
Props (`userEmail`, `userName`, `accessId`) passed to `AccessQABot`:
- `UserInfo` type defined in `flow-context.ts`
- `getCurrentFormWithUserInfo()` merges user info with form state
- Flows check for existing user data and skip collection steps

### File Attachments
In `@snf/qa-bot-core`:
- `FileUploadComponent` - React component with drag-drop
- `filesToBase64()` - Converts files for API submission
- Screenshot capture built-in

### Ticket API Infrastructure
Complete in `src/utils/ticket-api.ts`:
- `submitTicket()` - High-level submission function
- `prepareApiSubmission()` - Formats data for JSM API
- `sendToProxy()` - Calls Netlify proxy endpoint
- `generateSuccessMessage()` - Creates user-friendly result messages
- Request type IDs defined for all ticket types

### isLoggedIn vs enabled
Deferred. Wrapper accepts `isLoggedIn`, translates to `enabled` for qa-bot-core.
