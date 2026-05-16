# Corrections

- ❌ Using `fc.string().filter(s => /^[a-z_]+$/.test(s))` for field names → ✅ Use `/^[a-z][a-z_]*$/` to exclude `__proto__` and other dunder names that break `hasOwnProperty` checks in property tests
- ❌ Running `npm run test` includes Search.test.tsx which needs jsdom → ✅ Use `npx vitest --run --exclude "**/Search.test.tsx"` or run specific directories for non-DOM tests

# Codebase Patterns

- **Property test pattern**: Use `fc.assert(fc.property(...), { numRuns: 100 })` with vitest `describe/it`. Tag with `// Feature: inline-editing, Property N: title`
- **Import aliases**: `util/...`, `pages/...`, `styles/...` resolve to `src/util/`, `src/pages/`, `src/styles/` (configured in vitest.config.ts and tsconfig.json)
- **Test file location**: `src/<module>/__tests__/<name>.property.test.ts` for property tests
- **Type imports**: Domain types from `util/types/PageTypes` (PageName, DataType, FieldsDataType, etc.)

---

## 2026-05-16 - Task 1: Create utility modules and types
- Implemented: fieldMapper.ts, validation.ts, keyboardNavigation.ts, moveToOutstock.ts
- Property tests: fieldMapper.property.test.ts, validation.property.test.ts, keyboardNavigation.property.test.ts, moveToOutstock.property.test.ts
- Files changed: 8 new files in src/util/ and src/util/__tests__/
- Tools used: vitest (run tests), tsc --noEmit (typecheck)
- Corrections added: __proto__ field name filter, jsdom exclusion for non-DOM tests
---
