# Development Plan: ACCESS QA Bot Wrapper

## Current Status

### ✅ Completed

| Phase | Description | Notes |
|-------|-------------|-------|
| **Phase 1: User Context** | User info in flows | Props flow through `AccessQABot` → `UserInfo` → `flow-context.ts`. Skips form fields when data available. |
| **Phase 2: File Attachments** | Upload component | Implemented in `@snf/qa-bot-core`. Imported as `FileUploadComponent`. |
| **Phase 4: ACCESS Login Flow** | 10-step ticket flow | Full flow with file upload, validation, summary, JIRA submission. |
| **Phase 4: Affiliated Login Flow** | 10-step ticket flow | For resource provider login issues. Uses `loginProvider` ticket type. |
| **Phase 6: Main Menu** | Navigation | Routes between Q&A, tickets, metrics, security. |
| **Infrastructure** | Build system, types, API | ESM/UMD/Standalone builds, TypeScript definitions, ticket API with Netlify proxy. |
| **Footer Fix** | qa-bot-core bug fix | Fixed footer flash issue - moved config from useEffect to useMemo. |

### ❌ Remaining

| Phase | Description | Priority |
|-------|-------------|----------|
| **General Help Flow** | Multi-step general help ticket with keywords, priority, category | High |
| **Security Incident Flow** | 8-step security reporting | Medium |
| **Metrics/XDMoD Flow** | Usage and performance queries | Low |

---

## Next: General Help Flow

**Reference:** `qa-bot/src/utils/flows/tickets/general-help-flow.js`

**Steps:**
1. Title/summary (text input)
2. Category selection (options)
3. Description (text input)
4. Attachment? (yes/no)
5. File upload (conditional)
6. Involves resource? (yes/no)
7. Resource selection + User ID at resource (conditional)
8. Keywords (checkbox, up to 5)
9. Additional keywords (conditional, if "I don't see a relevant keyword")
10. Priority selection
11. Email (if not provided)
12. Name (if not provided)
13. ACCESS ID (optional)
14. Summary + confirmation
15. Success message

**Files to create:**
- `src/flows/general-help-flow.tsx`

**Files to modify:**
- `src/flows/ticket-flow.ts` (wire up "Another question" option)

---

## Then: Security Incident Flow

**Reference:** `qa-bot/src/utils/flows/security-flow.js`

**Steps:**
1. Brief summary (text input)
2. Priority selection (Critical/High/Medium/Low)
3. Detailed description (text input)
4. Attachment? (yes/no)
5. File upload (conditional)
6. Contact info verification (smart - shows existing info if available)
7. Name (if needed)
8. Email (if needed)
9. ACCESS ID (optional)
10. Summary + confirmation
11. Success message

**Files to create:**
- `src/flows/security-flow.tsx`

**Files to modify:**
- `src/flows/main-menu-flow.ts` (add "Report a security issue" option)

---

## Then: Metrics/XDMoD Flow

**Reference:** `qa-bot/src/utils/flows/metrics-flow.js`

**Goal:** Usage and performance queries via XDMoD API.

**Files to create:**
- `src/flows/metrics-flow.ts`

**Files to modify:**
- `src/flows/main-menu-flow.ts` (add XDMoD option)

---

## Architecture Notes

### Language/Strings Source
All user-facing strings should match the old qa-bot repo exactly:
- `qa-bot/src/utils/flows/main-menu-flow.js`
- `qa-bot/src/utils/flows/tickets/*.js`
- `qa-bot/src/utils/flows/security-flow.js`
- `qa-bot/src/utils/flows/metrics-flow.js`

### chatDisabled Pattern
- Steps with `options` → `chatDisabled: true` (buttons only)
- Steps without `options` → omit chatDisabled (defaults to enabled for text input)
- Uses react-chatbotify's built-in default from `settings.chatInput.disabled`

### Ticket API Infrastructure
Complete in `src/utils/ticket-api.ts`:
- `submitTicket()` - High-level submission function
- Request type IDs: SUPPORT=17, LOGIN_ACCESS=30, LOGIN_PROVIDER=31, SECURITY=26

### Naming Convention
The old qa-bot uses "affiliated" for resource login. We renamed to "resource" for clarity.
- Old: `affiliated_help`, `affiliated_login_*`
- New: `resource_help`, `resource_login_*`

Both work - the important thing is internal consistency.
