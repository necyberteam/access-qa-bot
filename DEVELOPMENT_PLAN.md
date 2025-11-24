# Development Plan: ACCESS QA Bot Wrapper

## Current Status ✅

- Basic wrapper with API compatibility (isLoggedIn → enabled translation)
- Q&A flow working (handled by qa-bot-core)
- ThumbsUpThumbsDown feedback component
- Session management
- Build system (ESM, UMD, Standalone)
- TypeScript definitions

## Phase 1: User Context Integration

**Goal:** Use userEmail, userName, accessId props in flows

**Tasks:**
- Create UserContext provider to manage user info
- Pre-populate forms with user data when available
- Add "skip contact info" logic when user data is complete

**Files to modify:**
- New: `src/contexts/UserContext.tsx`
- Update: `src/components/AccessQABot.tsx` (wrap with provider)

## Phase 2: File Attachment Support

**Goal:** Allow users to attach files to any submission

**Tasks:**
- Create FileUploadComponent with drag-drop
- Add screenshot capture integration
- Implement base64 conversion for API submission
- Add file preview modal
- 10MB size limit validation

**New files:**
- `src/components/FileUploadComponent.tsx`
- `src/utils/file-utils.ts` (base64 conversion, validation)

## Phase 3: Ticket Flow - General Help

**Goal:** Implement full 17-step General Help ticket flow

**Tasks:**
- Create ticket flow structure (multi-step form)
- JSM ProForma field mapping
- Form validation at each step
- Summary screen before submission
- API integration with Netlify endpoint

**New files:**
- `src/flows/ticket-flow.ts` (main ticket logic)
- `src/flows/general-help-flow.ts` (17 steps)
- `src/components/TicketSummary.tsx`
- Update: `src/utils/api.ts` (add ticket submission)

**ProForma fields to map:**
- summary, description, email, name, accessId
- hasResourceProblem, resourceName, userIdAtResource
- suggestedKeyword, noRelevantKeyword
- attachments array

## Phase 4: Ticket Flows - Login Issues

**Goal:** ACCESS Login (10 steps) + Resource Login (10 steps)

**Tasks:**
- Implement ACCESS login flow (requestTypeId: 30)
- Implement Resource login flow (requestTypeId: 31)
- Reuse form components from Phase 3
- Different ProForma mappings for each type

**New files:**
- `src/flows/access-login-flow.ts`
- `src/flows/resource-login-flow.ts`

## Phase 5: Security Incident Flow

**Goal:** 8-step security incident reporting

**Tasks:**
- Brief summary collection
- Priority selection (Critical/High/Medium/Low)
- Detailed description
- File attachments
- Contact verification
- Submit to security endpoint (requestTypeId: 26)

**New files:**
- `src/flows/security-flow.ts`
- `src/components/PrioritySelector.tsx`

## Phase 6: Main Menu Integration

**Goal:** Route between all flows from main menu

**Tasks:**
- Create main menu flow (4 options)
- Wire up: Q&A, Ticket, Metrics, Security
- New chat button (resets to main menu)

**New files:**
- `src/flows/main-menu-flow.ts`
- `src/components/NewChatButton.tsx`

## Phase 7: Metrics/XDMoD Flow

**Goal:** Usage and performance queries

**Tasks:**
- Similar to Q&A flow but different endpoint
- API integration with metrics endpoint
- Feedback collection

**Update:**
- `src/utils/api.ts` (add metrics endpoints)
- `src/flows/metrics-flow.ts`

## Phase 8: Feedback Flow

**Goal:** General feedback collection (not Q&A specific)

**Tasks:**
- Multi-step feedback collection
- Role selection
- File uploads
- Community involvement questions
- Anonymous or identified submission

**New files:**
- `src/flows/feedback-flow.ts`

## Phase 9: Testing & Integration

**Goal:** Verify drop-in replacement for access-ci-ui

**Tasks:**
- Integration testing with access-ci-ui
- Test all flows end-to-end
- Verify API submissions work
- Test standalone bundle in browser
- Cross-browser testing

## Phase 10: Documentation & Publishing

**Goal:** Production-ready release

**Tasks:**
- Complete API documentation
- Usage examples for all flows
- Migration guide from old qa-bot
- Publish to npm as @snf/access-qa-bot@3.0.0
- Update access-ci-ui to use new version

## Recommended Order

**Start with Phase 2 (File Attachments) because:**
- Needed by multiple flows (tickets, security, feedback)
- Self-contained component
- Easy to test in isolation

**Then Phase 1 (User Context) because:**
- Also needed by multiple flows
- Simple provider pattern
- Unlocks better UX for all subsequent flows

**Then Phases 3-5 (Ticket Flows) because:**
- Core functionality
- High user value
- Builds on Phase 1 & 2

**Finally Phases 6-8 (Menu, Metrics, Feedback):**
- Polish and complete feature set

## Estimated Scope

- **Phase 1:** ~2-3 hours
- **Phase 2:** ~4-6 hours
- **Phase 3:** ~6-8 hours
- **Phase 4:** ~4-6 hours (reuses Phase 3 patterns)
- **Phase 5:** ~3-4 hours
- **Phase 6:** ~2-3 hours
- **Phase 7:** ~2-3 hours
- **Phase 8:** ~3-4 hours
- **Phase 9:** ~4-6 hours
- **Phase 10:** ~3-4 hours

**Total:** ~35-50 hours for full feature parity

## Notes

- isLoggedIn/enabled debate is deferred - translation layer works fine
- Each phase can be tested independently
- Can deploy incrementally (Phase 3 alone adds value)
- Build system already complete
- TypeScript will catch API mismatches early

## Architecture Decisions Deferred

The `isLoggedIn` vs `enabled` architectural discussion with Andrew has been deferred. Current implementation:
- Wrapper accepts `isLoggedIn` from consumers
- Translates to `enabled` for qa-bot-core
- Works with current qa-bot-core implementation
- Can be updated later if/when qa-bot-core adds separate props
