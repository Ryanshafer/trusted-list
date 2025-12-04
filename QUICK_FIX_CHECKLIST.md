# Quick Fix Checklist

This document tracks the immediate fixes identified in the codebase review.

## ✅ Completed

- [x] **Dark Mode Gradient Fix** - Fixed hardcoded white gradients in ChatDialog.tsx to use theme-aware `from-background` class

## 🔲 High Priority (Complete This Week)

### 1. Add Missing ARIA Labels

#### ChatDialog.tsx
- [ ] Add label for chat message textarea (line 134)
- [ ] Add aria-label for attach button (already has it ✓)
- [ ] Add aria-label for send button (needs descriptive label)

#### InteractionsPage.tsx
- [ ] Add aria-labels for icon-only buttons
- [ ] Ensure all form fields have associated labels

#### AppShell.tsx
- [ ] Add aria-labels for carousel navigation buttons
- [ ] Add aria-labels for icon-only action buttons

### 2. Extract Constants

Create `src/features/dashboard/constants.ts`:
```typescript
export const CHAT_DIALOG_HEIGHT = "80dvh";
export const GAUGE_SIZE = 250;
export const GAUGE_STROKE = 64;
export const DEFAULT_KARMA_POINTS = 50;
export const ANIMATION_DURATION = 2000;
export const COMPLETION_FORM_ANIMATION_DELAY = 900;
export const SEND_REQUEST_DELAY = 1200;
```

Then replace hardcoded values in:
- [ ] ChatDialog.tsx
- [ ] AppShell.tsx
- [ ] InteractionsPage.tsx

### 3. Remove Unused Imports

Run through each file and remove:
- [ ] `Flag` from InteractionsPage.tsx (line 5)
- [ ] `Paperclip` from ChatDialog.tsx (line 1)
- [ ] Any other unused imports found by linter

### 4. Add ESLint Configuration

- [ ] Install ESLint and TypeScript plugin
- [ ] Create `.eslintrc.json` configuration
- [ ] Add lint script to package.json
- [ ] Run lint and fix auto-fixable issues

## 🟡 Medium Priority (Complete This Month)

### 5. Add Memoization

- [ ] Wrap `HelpSection` in React.memo (AppShell.tsx:146)
- [ ] Wrap `FilterBar` in React.memo (InteractionsPage.tsx:603)
- [ ] Wrap `ChatBubble` in React.memo (ChatDialog.tsx:303)
- [ ] Wrap `CompletionForm` in React.memo (ChatDialog.tsx:229)

### 6. Extract Shared Hooks

Create `src/features/dashboard/hooks/useChatMessages.ts`:
- [ ] Extract chat message handling logic
- [ ] Update InteractionsPage.tsx to use hook
- [ ] Update ChatDialog.tsx if applicable

### 7. Add Error Boundary

- [ ] Create ErrorBoundary component
- [ ] Wrap AppShell with ErrorBoundary
- [ ] Wrap InteractionsPage with ErrorBoundary
- [ ] Add error logging

### 8. Improve Type Safety

- [ ] Create separate type files for shared types
- [ ] Export AskContact type from types file
- [ ] Add explicit return types to functions
- [ ] Fix any implicit 'any' types

## 🟢 Low Priority (Nice to Have)

### 9. Add Loading States

- [ ] Create HelpRequestCardSkeleton component
- [ ] Add loading state to AppShell
- [ ] Add loading state to InteractionsPage
- [ ] Add loading state to ChatDialog

### 10. Improve Naming Consistency

- [ ] Document naming conventions in agents.md
- [ ] Refactor inconsistent names (optional, breaking change)

---

## Commands to Run

### Install Development Dependencies
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-react-hooks
npm install -D husky lint-staged
```

### Setup ESLint
```bash
npx eslint --init
```

### Setup Husky
```bash
npx husky-init && npm install
```

### Run Linter
```bash
npm run lint
npm run lint:fix
```

### Type Check
```bash
npx tsc --noEmit
```

---

## Progress Tracking

**Week 1**: Focus on High Priority items (1-4)  
**Week 2-3**: Focus on Medium Priority items (5-8)  
**Week 4**: Focus on Low Priority items (9-10)

**Last Updated**: December 4, 2025  
**Completed**: 1/10 items
