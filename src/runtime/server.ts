import { createError, defineEventHandler, readBody } from 'h3'
import type { FetchError, SearchParameters } from 'ofetch'
import { ReapitConnectServerSession } from './reapit/connect'
import { DEFAULT_HEADERS } from './constants'
import { useRuntimeConfig } from '#imports'

const { reapit: { connect, platform } } = useRuntimeConfig()

let reapitConnectSession: ReapitConnectServerSession | undefined

export default defineEventHandler(async (event) => {
  const { path, query, headers } = await readBody<{
    path: string
    query?: SearchParameters
    headers?: Record<string, string>
  }>(event)
  // const key = decodeURIComponent(getRouterParam(event, 'key')!)

  try {
    reapitConnectSession ??= new ReapitConnectServerSession({
      connectClientId: connect.clientId,
      connectClientSecret: connect.clientSecret,
      connectOAuthUrl: connect.apiUrl,
    })
    const accessToken = await reapitConnectSession.connectAccessToken()

    return await globalThis.$fetch<any>(
      path,
      {
        baseURL: platform.apiUrl,
        query,
        headers: {
          ...DEFAULT_HEADERS,
          ...headers,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  }
  catch (err) {
    console.error(err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch data from Reapit Connect API',
      data: (err as FetchError).message,
    })
  }
})
