# TechZone Pro — React storefront demo

TechZone Pro is the React implementation of the approved TechZone redesign. It covers the cinematic landing page, storefront/catalogue, product variants, AI-assisted PC builder, cart and pickup checkout, customer account/order/warranty screens, staff order handover, warranty intake, technician workflow, and admin product/specification/promotion screens.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. The project uses React 19, Vite, React Router, Anime.js and the locally bundled Be Vietnam Pro font.

Validation commands:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Demo roles

The login page contains role buttons that fill demo accounts. The shared demo password is `Demo@123`. Customer, Staff, Technician and Admin routes are protected by client-side role guards so the screens can be explored without a backend.

The demo state is stored in localStorage under `techzone-demo-v1`. Use the browser's storage controls to reset it when you want a fresh walkthrough. Session identity is kept in sessionStorage. These guards and credentials are for walkthroughs only; they are not authentication or authorization.

## Important business behavior

- Orders are pickup-only and snapshot product prices, quantities and warranty terms at creation.
- Stock is reserved when an order is created, released once when an eligible order is cancelled, and physical handover requires payment plus one unique serial per purchased unit.
- RAM is sold by individual stick. Builder validation checks the selected mainboard's slot count and capacity, memory type, CPU socket, PSU headroom, M.2 availability and case/cooler dimensions. Unknown technical metadata blocks purchase until the data is verified.
- Promotions validate active dates, total quota and one-use-per-customer semantics. The home banner reads the active promotion/banner record and follows its configured link.
- Warranty cards are created per physical unit and warranty intake prevents an open duplicate ticket for the same card.

## Backend handoff

The UI intentionally uses a local transactional demo service in `src/services/demoStore.js` so each flow is reviewable without an API. The `request(path, options)` helper is the integration boundary: set `VITE_API_BASE_URL` and replace demo actions with server calls for authentication, catalog, inventory reservation, promotion claims, orders/payments, serial handover, warranty tickets and admin CRUD.

The warranty screens (`/van-hanh/bao-hanh`, `/ky-thuat`, `/bao-hanh`) are the first flow wired to the backend. They call `src/services/aftersales.js`, which has two implementations returning the same data shape: after a real login (a backend token is in sessionStorage) it calls the `aftersales` API (`/api/warranty-cards`, `/api/service-requests`, `/api/my/warranty-cards`); in a demo session without a token it runs the same rules locally from `src/domain/commerce.js`. Orders and handover are still demo-only, so warranty cards created by a demo handover exist only in the browser and are not visible in API mode.

The AI builder currently uses a deterministic demo suggestion and a transparent compatibility validator. A production implementation should call an AI service only after loading verified product/specification data, then run the returned proposal through the same server-side validator. Payment is simulated as store collection; no card data is accepted or persisted.

## Reference material

The original static prototypes remain outside this app at `UI_UX_Design/techzone-redesign`. The copied manifest is in `docs/reference/manifest.json`; the implementation plan is in `docs/plans/2026-10-03-techzone-react.md`.

