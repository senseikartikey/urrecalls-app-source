# UrRecalls – app source

The application source (screens, navigators, components, networking) for
**UrRecalls**, a React Native mobile app for checking **FDA food & drug recalls**,
scanning product barcodes, and tracking product warranties.

This repo is source-only – there's no `package.json` or native project here. The
full, buildable Expo project is
[`UrRecalls-app-personal`](https://github.com/senseikartikey/UrRecalls-app-personal).

## Stack

| Concern | Choice |
|---------|--------|
| Framework | React Native + Expo |
| Navigation | React Navigation (stack + bottom tabs), custom `navigators/` |
| Auth | Clerk (`@clerk/clerk-expo`) with `expo-secure-store` token cache |
| UI | React Native Paper (Material), light/dark theming in `styles/` |
| i18n | `i18n-js`, strings in `locales/`, `t()` helper in `utility/` |
| Data | openFDA API (recalls), Sifter Connect API (food product search), an AWS-hosted recall service |

## Layout

| Path | Contents |
|------|----------|
| `App.tsx` | Root – Clerk provider, navigation container, theme setup. |
| `navigators/` | Root / login / main navigators and route types. |
| `screens/` | Feature screens: `drug/`, `food/`, `homes/`, `login/`, `issues/`, `report/`, `product/`, `search/`. |
| `components/` | Shared UI – bottom nav, scanner modal, generic primitives. |
| `network/` | API clients (Sifter token handling, recall lookups). |
| `warrantyComponents/` | Warranty registration / status flow. |
| `store.ts` | App state. |
| `utility/` | Localization + logging helpers. |

## Using it

Drop these files into an Expo project (see `UrRecalls-app-personal` for the
matching `package.json`, `app.config.ts`, and native folders), then:

```bash
npm install
npx expo start
```

Set `CLERK_PUBLISHABLE_KEY` in `.env.local`.
