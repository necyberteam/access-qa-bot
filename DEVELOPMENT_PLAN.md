# Development Plan: ACCESS QA Bot Wrapper

## Current Status

### ✅ Completed

| Phase | Description | Notes |
|-------|-------------|-------|
| **Phase 1: User Context** | User info in flows | Props flow through `AccessQABot` → `UserInfo` → `flow-context.ts`. Skips form fields when data available. |
| **Phase 2: File Attachments** | Upload component | Implemented in `@snf/qa-bot-core` (better architecture). Imported as `FileUploadComponent`. |
| **Phase 4: ACCESS Login Flow** | 10-step ticket flow | Full flow with file upload, validation, summary, JIRA submission. |
| **Phase 6: Main Menu** | Navigation | Routes between Q&A and ticket flows. |
| **Infrastructure** | Build system, types, API | ESM/UMD/Standalone builds, TypeScript definitions, ticket API with Netlify proxy. |

### ⏳ In Progress

| Item | Status |
|------|--------|
| Ticket type selection | UI exists, but only ACCESS Login is wired up |

### ❌ Remaining

| Phase | Description | Priority |
|-------|-------------|----------|
| **Resource Login Flow** | 10-step flow for resource login issues | High |
| **General Help Flow** | Multi-step general help ticket | High |
| **Security Incident Flow** | 8-step security reporting | Medium |
| **Metrics/XDMoD Flow** | Usage and performance queries | Low |
| **Feedback Flow** | General feedback collection | Low |

---

## Next Up: Resource Login Flow

**Goal:** Implement ticket flow for users having trouble logging into an affiliated resource (not ACCESS itself).

**Request Type ID:** 31 (LOGIN_PROVIDER)

**Steps:**
1. Describe the issue (text input)
2. Which resource? (dropdown or text)
3. Resource username (optional)
4. Identity provider used
5. Browser used
6. Attachment? (yes/no)
7. File upload (conditional)
8. Email (if not provided via props)
9. Name (if not provided via props)
10. ACCESS ID (optional)
11. Summary + confirmation
12. Success/error message

**Files to create:**
- `src/flows/resource-login-flow.tsx`

**Files to modify:**
- `src/flows/ticket-flow.ts` (wire up "Logging into a resource" option)

**Estimated time:** 3-4 hours (reuses ACCESS login patterns)

---

## Then: General Help Flow

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

**Estimated time:** 4-5 hours

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
| Resource Login Flow | 3-4 hours |
| General Help Flow | 4-5 hours |
| Security Incident Flow | 2-3 hours |
| Metrics/XDMoD Flow | 3-4 hours |
| Feedback Flow | 3-4 hours |
| Testing & Documentation | 6-8 hours |
| **Total Remaining** | **~22-28 hours** |

---

## Architecture Notes

### User Context Implementation
The original plan called for a `UserContext.tsx` provider. Instead, we used a simpler approach:
- Props (`userEmail`, `userName`, `accessId`) passed to `AccessQABot`
- `UserInfo` type defined in `flow-context.ts`
- `getCurrentFormWithUserInfo()` merges user info with form state
- Flows check for existing user data and skip collection steps

This is less boilerplate and works well since user info only flows one direction (down).

### File Attachments
Moved to `@snf/qa-bot-core` for reuse across projects:
- `FileUploadComponent` - React component with drag-drop
- `filesToBase64()` - Converts files for API submission
- Screenshot capture built-in

### Ticket API Infrastructure
Already complete in `src/utils/ticket-api.ts`:
- `submitTicket()` - High-level submission function
- `prepareApiSubmission()` - Formats data for JSM API
- `sendToProxy()` - Calls Netlify proxy endpoint
- `generateSuccessMessage()` - Creates user-friendly result messages
- Request type IDs defined for all ticket types

### isLoggedIn vs enabled
Deferred architectural discussion. Current implementation:
- Wrapper accepts `isLoggedIn` from consumers
- Translates to `enabled` for qa-bot-core
- Works with current qa-bot-core implementation
