# nuxt-reapit

[![npm version](https://img.shields.io/npm/v/nuxt-reapit?color=a1b858&label=)](https://www.npmjs.com/package/nuxt-reapit)

> Reapit integration for [Nuxt](https://nuxt.com).

- [✨ &nbsp;Release Notes](https://github.com/johannschopplich/nuxt-reapit/releases)

## Setup

```bash
# pnpm
pnpm add -D nuxt-reapit

# npm
npm i -D nuxt-reapit

# yarn
yarn add -D nuxt-reapit
```

## Basic Usage

Add the `nuxt-reapit` module to your `nuxt.config.ts`:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-reapit']
})
```

Set your Reapit Connect credentials by adding them to your project's `.env` file:

```ini
REAPIT_CONNECT_CLIENT_ID=
REAPIT_CONNECT_CLIENT_SECRET=
# The following are optional and default to the Reapit production URLs
REAPIT_CONNECT_API_URL=https://connect.reapit.cloud
REAPIT_PLATFORM_API_URL=https://platform.reapit.cloud
```

Instead of the `.env` file, you can also set the credentials using the `reapit` module configuration:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-reapit'],

  reapit: {
    connect: {
      clientId: '',
      clientSecret: '',
      // Default values
      apiUrl: 'https://connect.reapit.cloud',
    },
    platform: {
      // Default values
      apiUrl: 'https://platform.reapit.cloud',
    },
  }
})
```

## 💻 Development

1. Clone this repository
2. Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
3. Install dependencies using `pnpm install`
4. Run `pnpm run dev:prepare`
5. Start development server using `pnpm run dev`

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
