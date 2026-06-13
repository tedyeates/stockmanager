# Review Notes

## Consistency Check

### ✅ Consistent Across Documents

- **Tech stack** — All docs agree: Django 4.2+, DRF, React 18, TypeScript, PostgreSQL (Supabase), Vite
- **API structure** — interfaces.md and workflows.md align on endpoint paths, auth mechanism, pagination
- **Model relationships** — data_models.md ER diagram matches the FK/M2M references in components.md and workflows.md
- **Custom managers** — Business logic described in data_models.md matches the workflow diagrams in workflows.md
- **Frontend state pattern** — architecture.md, components.md, and workflows.md all describe the same context provider hierarchy

### ⚠️ Minor Inconsistencies Found

| Issue | Location | Details |
|-------|----------|---------|
| `Requests` class method signatures | interfaces.md vs actual code | `Requests.post` and `Requests.put` take `(url, data, headers)` but interfaces.md shows `headers` as optional — this is correct but differs from how `delete`/`get` take `(url, headers)` |
| `Item.number_fields` includes `weight` | data_models.md | The model defines `number_fields = {"weight", ...}` but there is no `weight` field on Item. Likely a legacy remnant in the code. |
| Duplicate price logic | architecture.md + workflows.md | Price recalculation exists in both `InstockManager.create_instock` AND `InstockViewSet.create` — the ViewSet version is the active path; manager's `create_instock` may be unused legacy code |

---

## Completeness Check

### ✅ Well-Documented Areas

- Model structure and field details
- API endpoints and payload shapes
- Frontend component hierarchy and state management
- Core business workflows (instock/outstock creation, validation)
- Deployment topology and configuration

### 🔲 Gaps Identified

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| **No documentation of error handling patterns** | Medium | Document how errors propagate: Django ValidationError → DRF ValidationError → 400 JSON → frontend `RequestError` → `validationErrors` state |
| **Cypress E2E test helpers undocumented** | Low | `cypress_helpers.py` provides `CypressTestView` and `CypressInstockTestView` — document what data they create/delete and their intended use |
| **`import_progress/` module not documented** | Low | The `stockmanagement/import_progress/` directory exists but wasn't analyzed — likely related to Excel import progress tracking |
| **Frontend CSS architecture** | Low | Multiple CSS files in `styles/` — no documentation on theme system, dark mode support, or naming conventions |
| **Delete workflow not documented** | Medium | No workflow shows how deletion works. The ViewSet inherits `ModelViewSet.destroy` — need to verify if Item deletion cascades properly or is blocked |
| **`PopupContextManager`** mentioned in steering docs | Medium | Referenced in project structure steering file but not found in analyzed code — may have been removed/refactored into `InlineEditingContext` |
| **Pagination edge cases** | Low | `usePagination` hook logic for computing visible page numbers not documented |
| **Outstock `remaining_quantity` display** | Low | Field exists and is saved, but serializer excludes it from the update form (`OutstockUpdateSerializer.Meta.exclude`) — worth noting this is write-only |
| **`loadstock` Excel format** | Medium | No documentation of expected Excel column layout. Would help users prepare import files |

### 🔲 Language/Tool Limitations

| Area | Issue |
|------|-------|
| CSS analysis | Tailwind utility classes + custom CSS files not parsed for documentation — styling patterns inferred from component code |
| E2E tests | Cypress specs in `cypress/` directory not analyzed — would reveal additional UI flows |
| Migration history | Only migration filenames analyzed — specific schema evolution not documented |

---

## Recommendations

1. ~~**Clarify dual price logic**~~ — **RESOLVED**: `InstockManager.create_instock` is dead code (never called). `InstockViewSet.create` is the sole active path. Manager method can be removed in future cleanup.

2. ~~**Document delete behavior**~~ — **RESOLVED**: Added workflow #12 to `workflows.md`. All FKs use `SET_NULL`. Crucially: deleting Instock/Outstock does NOT reverse quantity/price effects.

3. ~~**Add Excel import format spec**~~ — **RESOLVED**: Added workflow #13 to `workflows.md` with full column layouts for both file variants.

4. ~~**Remove `weight` from `Item.number_fields`**~~ — **RESOLVED**: Removed from `models.py`. No weight field exists on the model.

5. ~~**Verify PopupContextManager removal**~~ — **RESOLVED**: Confirmed deleted per inline-editing spec. Updated `.kiro/steering/structure.md` to reference `InlineEditing` instead.
