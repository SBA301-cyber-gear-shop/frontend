# TechZone React Implementation Plan

**Goal:** Implement all 26 TechZone design screens as an accessible responsive React application with working local demo flows and a documented backend boundary.

**Architecture:** Feature-oriented React components, React Router, shared UI primitives and application state. A local demo service owns transactional validation and browser persistence; no real login, AI or payment is implied. Retain the approved visual system and assets, never render the HTML prototypes through an iframe or injected HTML.

**Tech Stack:** Existing React 19 + Vite 8 JavaScript base, React Router 7, Anime.js 4, CSS, Playwright, Node test runner.

## Design direction

Industrial technology storefront: red accent, navy operations shell, light commerce surfaces, cinematic dark landing. Preserve approved composition. Locally hosted Be Vietnam Pro supports Vietnamese text; restrained staggered entrances and interaction feedback, respecting reduced motion. DFII: impact 4 + fit 5 + feasibility 5 + performance 4 - consistency risk 3 = 15.

## Scope

- All landing/store/catalog/product/build/cart/checkout/auth/account/order/warranty/staff/technician/admin/error screens.
- Local demo data, form validation, filtering, state transitions, per-device warranty, simulated recommendations and payment; documented replacement points for backend.
- No deployment, actual transactions, external messages or claims of backend security.

## Tasks

1. Inspect reference pages, styles, assets and project instructions. Read the six requested skills. Preserve the original design folder.
2. Implement `src/data/seed.js`, `src/domain/commerce.js`, `src/services/demoStore.js`, shared context. Validate inventory, voucher uniqueness, order totals, warranty transitions, build checks.
3. Implement shared components and Store/Admin layouts with keyboard navigation, responsive CSS, notifications, dialogs and route guards.
4. Implement Landing, Home, Catalog, Product and Auth pages using reference assets and layout. Add controlled carousel, search, filters, quantity/variant selection and demo sign-in.
5. Implement Builder, Cart and Checkout. Persist drafts, revalidate edits, prohibit unknown/invalid builds, create consistent demo orders.
6. Implement Account, Orders and Warranty views with ownership filtering. Staff order processing, payment confirmation, serial handover and warranty intake. Technician inspection/repair/return.
7. Implement product/variant editing, category/specification toggles, promotion/banner editor. Changes must affect storefront data.
8. Add route map, API handoff documentation, meaningful domain and browser tests. Run `npm run test`, `npm run lint`, `npm run build`, `npm run test:e2e`.
9. Inspect screenshots at desktop and mobile widths, fix overflow, runtime/console errors, failed interactions and accessibility issues. Document any backend limitations honestly.

## Validation

Cover all routes at 390px and 1440px, shopping through fulfillment, voucher reuse/stock limits, authorization views, incompatible RAM, warranty duplicate intake, CRUD persistence and reduced motion. Record results in `docs/IMPLEMENTATION.md`.

## Skill application

Use frontend-design and design-spells within the existing approved aesthetic; react-patterns for composition and state; concise-planning/writing-plans for this task breakdown; animejs-animation via the current v4 scoped React API. User authorization is to implement directly in the named project, so no extra plan-approval or worktree handoff is required. The referenced superpowers subskills are not installed; execute this plan directly using the available tools.
