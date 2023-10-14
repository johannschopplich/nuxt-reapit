/* eslint-disable node/prefer-global/process */
import { defu } from 'defu'
import { addImports, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'
import { name, version } from '../package.json'

export interface ModuleOptions {
  connect?: {
    clientId?: string
    clientSecret?: string
    /**
     * @default 'https://connect.reapit.cloud'
     */
    apiUrl?: string
  }
  platform?: {
    /**
     * @default 'https://platform.reapit.cloud'
     */
    apiUrl?: string
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'reapit',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: {
    connect: {
      clientId: process.env.REAPIT_CONNECT_CLIENT_ID || '',
      clientSecret: process.env.REAPIT_CONNECT_CLIENT_SECRET || '',
      apiUrl: process.env.REAPIT_CONNECT_API_URL || 'https://connect.reapit.cloud',
    },
    platform: {
      apiUrl: process.env.REAPIT_PLATFORM_API_URL || 'https://platform.reapit.cloud',
    },
  },
  async setup(options, nuxt) {
    // Private runtime config
    nuxt.options.runtimeConfig.reapit = defu(
      nuxt.options.runtimeConfig.reapit,
      options,
    )

    // Transpile runtime
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.build.transpile.push(resolve('runtime'))

    // Add KQL proxy endpoint to send queries server-side
    addServerHandler({
      route: '/api/__reapit/:key',
      method: 'post',
      handler: resolve('runtime/server'),
    })

    // Add KQL composables
    addImports(
      ['useReapit'].map(name => ({
        name,
        as: name,
        from: resolve(`runtime/composables/${name}`),
      })),
    )
  },
})
