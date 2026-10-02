# Implementation notes

## Screen map

| Area                  | Routes                                                                            |
| --------------------- | --------------------------------------------------------------------------------- |
| Brand and storefront  | `/`, `/cua-hang`, `/san-pham`, `/danh-muc/:category`, `/san-pham/:id`             |
| PC builder and buying | `/build-pc`, `/gio-hang`, `/thanh-toan`, `/trang-thai`                            |
| Customer              | `/dang-nhap`, `/dang-ky`, `/don-hang`, `/don-hang/:id`, `/bao-hanh`, `/tai-khoan` |
| Store operations      | `/van-hanh/don-hang`, `/van-hanh/ban-giao`, `/van-hanh/bao-hanh`, `/ky-thuat`     |
| Administration        | `/quan-tri/san-pham`, `/quan-tri/thong-so`, `/quan-tri/khuyen-mai`                |

The old prototype filenames are available as aliases in `src/App.jsx`, so links from the original design continue to resolve to the corresponding React route.

## Design conversion

The approved prototype CSS and local reference assets were converted into regular React components. Landing, commerce, authentication and operations layouts have separate shells, while shared controls live in `src/components/ui.jsx`. The app uses a local Be Vietnam Pro font, responsive navigation, keyboard-accessible tabs, labelled form controls, reduced-motion handling and scoped Anime.js v4 entrance animation.

## Demo domain

`src/domain/commerce.js` is deliberately pure. It validates merged quantities, snapshots quotes, caps promotion discounts, reserves/releases stock, requires payment before handover, creates unique physical-unit warranties and enforces the warranty ticket state machine. `src/data/seed.js` includes the demo catalog and compatibility metadata. The builder suggestion is deterministic demo logic; the final validator is the safety boundary that a production AI response must pass.

`src/state/StoreProvider.jsx` and `src/services/demoStore.js` provide browser persistence. The app labels simulated authentication, payment, AI and local storage clearly in the UI. `request()` is the future API seam and is never presented as a live backend.

## Verification

- `npm run test`: 11 domain tests passed.
- `npm run lint`: passed with generated Playwright reports ignored.
- `npm run build`: Vite production build passed.
- `npm run test:e2e`: 8 browser tests passed, including 21 routes at 1440px and 390px, shopping to serial handover, builder compatibility, admin persistence, duplicate warranty intake, authorization and catalogue filtering.

The browser tests use the demo state and do not replace server-side security, inventory transactions, payment provider callbacks or AI evaluation tests.
