# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ExosApp (aka "Exorta"/"Exodos") is a medical-device inventory and surgery-scheduling app for Elidev/Exos. It has two independently-deployed parts in this repo:

- `frontend/` — an Expo (React Native) app, the actual product surface (mobile + web).
- `backend/webservice/` — a PHP action-dispatch webservice that the frontend talks to. It is deployed on an external server, not run from this repo (see "Backend caveat" below).

`backend/server.py` + `backend/requirements.txt` are leftover FastAPI/Mongo scaffolding from the original project generator and are **not wired to the frontend** — the app never calls this service. Don't extend it assuming it's live; check `frontend/.env`'s `EXPO_PUBLIC_BACKEND_URL` and `frontend/context/AppContext.tsx`'s `servers` map before assuming which backend a change should target.

## Commands

All frontend work happens inside `frontend/`:

```bash
cd frontend
yarn install          # install deps (yarn is the lockfile of record; package-lock.json also present)
yarn start             # expo start — Metro bundler, scan QR or press w/a/i
yarn web               # expo start --web
yarn android           # expo run:android
yarn ios               # expo run:ios
yarn lint              # expo lint (eslint-config-expo flat config, see eslint.config.js)
```

There is no test suite in this repo (no jest config, no `*.test.*`/`*.spec.*` files, `tests/__init__.py` is empty). Don't assume a `yarn test` command exists.

There is no local run command for the PHP backend — `controller_ws.php` requires vendored libraries not committed here (`../lib/nusoap.php`, `../dompdf/autoload.inc.php`, `../assets/plugins/phpqrcode/qrlib.php`, `../lib/vendor/autoload.php`), which live on the deployed server outside this repo. Treat `backend/webservice/*.php` and `backend/include/*.php` as source you edit and ship, not something you execute locally.

## Architecture

### Frontend ↔ backend wire protocol

The frontend never uses REST/JSON in the usual sense. `frontend/services/ApiServices.ts` is a single static `ApiService` class:

- `ApiService.init({ url, passkey })` sets the webservice base URL and a static passkey (see `AppContext`'s `servers` map: `local`/`exos`/`exodos`).
- Every call goes through `ApiService.request(action, extraData)`, which GETs `controller_ws.php?action=<action>&key=<passkey>&...extraData`.
- The PHP side responds with **XML**, not JSON. `parseXmlToJson` walks the DOM and converts it: child elements become object properties, except elements whose tag name starts with `item_`, `subitem_`, or `prod_`, which are collected into an array instead. This prefix convention is how the backend signals "this is a list" — keep it in mind both when adding new PHP responses and when parsing them on the frontend.
- File uploads go through a separate `uploadFileDirect` path (`action=upload_pago_cirugia`, multipart form data, platform-specific blob/URI handling for web vs native).
- Every request also stamps `@exosapp_last_activity` in AsyncStorage — this drives a 5-minute idle-logout enforced by `_ActivityTrackerWrapper` (`components/elidev_components/_ActivityTrackerWrapper.tsx`).

Add a new backend call by adding a method to `ApiService` (thin wrapper around `this.request(...)`), not by calling `fetch` directly from screens.

### Backend action dispatch

`backend/webservice/controller_ws.php` is the single entrypoint. It reads `$_REQUEST["action"]` and dynamically invokes `$this->exosApp->$action()` on the `ExosApp` class in `exosapp.php` — there is no per-action routing table beyond that dynamic call. The `$metodos_info` array at the top of `controller_ws.php` is documentation/audit metadata only (surfaced via `action=audit_methods`), it does **not** perform routing — adding an entry there does not wire up a new action, and omitting one does not break it. To add a new API action: add a method with that exact name to the `ExosApp` class in `exosapp.php`, and optionally document it in `$metodos_info`.

Related PHP files:
- `include/db_tools.php`, `include/db_params.php` — DB connection/config.
- `include/functions.php`, `include/functions_ws.php`, `include/funciones_generales.php` — shared helpers.
- `webservice/controller_ws_audit.php`, `controller_ws_log.php` — audit/log-specific controllers, separate from the main action dispatcher.
- `webservice/ws_carpetas_administrativas.php` — standalone endpoint outside the main dispatcher.

### Frontend structure

- Routing is Expo Router (file-based) rooted at `frontend/app/`. `app/_layout.tsx` declares the top-level `Stack` (`index`, `login`, `(tabs)`, `profile`, `reporte_piezas_danadas_view`); `app/(tabs)/_layout.tsx` declares the tab group (`home`, `terminales`, `pickeo`, `cirugias_programar`, `cirugias_buscar`) — note the native tab bar is hidden (`tabBarStyle: { display: 'none' }`), navigation UI is custom (see `_MenuGrid`/`_MenuLauncher`/`openTabs` below).
- `frontend/context/AppContext.tsx` is the single global state provider (wraps the whole app in `_layout.tsx`): current `user`, `appConfig` (backend URL/passkey selection), `theme` (four palettes: light/dark/blue/pink, selected per-user and applied via the `theme` object rather than a CSS class), `language` (`es`/`en`, backed by `frontend/languages.json` and the `t(key)` dot-path translator), and an `openTabs` list used for an in-app tab-switcher UI (`addOpenTab`/`closeOpenTab`) distinct from Expo Router's own stack.
- `frontend/components/elidev_components/` is the shared UI kit, all prefixed with `_` and re-exported through `index.ts`. Import from `@/components/elidev_components` (barrel) rather than deep paths where possible — `elidev_components_org.tsx` is not exported from the barrel and looks like a stale/reference copy, don't build on it without checking it's actually unused first.
- `frontend/utils/PickeoUtils.ts` holds domain logic for the "pickeo" (picking) flow specifically; general helpers live in `components/elidev_components/_Functions.tsx` (e.g. `hexToRGBA`).
- Path alias `@/*` maps to `frontend/*` (see `tsconfig.json`).

### Domain vocabulary (Spanish)

The app is written with Spanish domain terms throughout code, not just UI copy — expect to read/write these as identifiers: `almacen` (warehouse), `terminal` (picking terminal/device), `pickeo` (picking), `cirugia` (surgery — scheduling, search, save), `medico`/`hospital`, `vendedor`/`tecnico`/`subdistribuidor`, `piezas_danadas` (damaged-parts reports), `pagos_cirugias` (surgery payment file uploads). Matching this vocabulary when adding fields/actions keeps the frontend and PHP backend consistent.
