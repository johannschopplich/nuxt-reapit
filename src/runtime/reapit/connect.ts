// Forked from https://github.com/reapit/foundations/blob/master/packages/connect-session/src/server/index.ts,
// because isomorphic fetch upstream will break usage in Nuxt.
// Changes made:
// - Replaced `axios` with `$fetch`
// - Replaced `jwt-decode` with `unjwt`
// - Removed isomorphic-fetch, which was imported in a utility file
// - Removed `@reapit/connect-session` dependency only for types

import { decodeJWT } from 'unjwt'
import type { CoginitoAccess, ReapitConnectServerSessionInitializers } from './types'

export class ReapitConnectServerSession {
  private connectOAuthUrl: string
  private connectClientId: string
  private connectClientSecret: string
  private accessToken: string | undefined

  constructor({ connectClientId, connectClientSecret, connectOAuthUrl }: ReapitConnectServerSessionInitializers) {
    this.connectOAuthUrl = connectOAuthUrl
    this.connectClientId = connectClientId
    this.connectClientSecret = connectClientSecret
    this.accessToken = undefined
    this.connectAccessToken = this.connectAccessToken.bind(this)
  }

  private get accessTokenExpired() {
    if (!this.accessToken)
      return true

    const decoded = decodeJWT<CoginitoAccess & { aud: string }>(this.accessToken)!
    const expiry = decoded.exp
    // 5 min to allow for clock drift
    const fiveMinsFromNow = Math.round(new Date().getTime() / 1000) + 300
    return expiry ? expiry < fiveMinsFromNow : true
  }

  // See: https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
  private async connectGetAccessToken() {
    try {
      // eslint-disable-next-line node/prefer-global/buffer
      const base64Encoded = Buffer.from(`${this.connectClientId}:${this.connectClientSecret}`).toString('base64')
      const session = await globalThis.$fetch<any>('token', {
        baseURL: this.connectOAuthUrl,
        query: {
          grant_type: 'client_credentials',
          client_id: this.connectClientId,
        },
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Encoded}`,
        },
      })

      if (session?.error)
        throw new Error(session.error)

      if (session?.access_token)
        return session.access_token

      throw new Error('No access token returned by Reapit Connect')
    }
    catch (error) {
      console.error('Reapit Connect Token Error', (error as any).message)
    }
  }

  public async connectAccessToken() {
    if (!this.accessTokenExpired)
      return this.accessToken!

    try {
      const accessToken = await this.connectGetAccessToken()

      if (accessToken) {
        this.accessToken = accessToken
        return accessToken
      }

      throw new Error('No session returned from Reapit Connect')
    }
    catch (error) {
      console.error('Reapit Connect session error', (error as any).message)
    }
  }
}
