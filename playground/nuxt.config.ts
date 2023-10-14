export default defineNuxtConfig({
  modules: ['../src/module.ts'],

  experimental: {
    typescriptBundlerResolution: true,
  },

  typescript: {
    typeCheck: 'build',
    shim: false,
  },
})
