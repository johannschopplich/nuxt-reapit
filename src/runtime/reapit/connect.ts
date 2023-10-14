// Forked from https://github.com/reapit/foundations/blob/master/packages/connect-session/src/server/index.ts,
// because isomorphic fetch upstream will break usage in Nuxt.
// Changes made:
// - Replaced `axios` with `ofetch`
// - Replaced `jwt-decode` with `unjwt`
// - Removed isomorphic-fetch, which was imported in a utility file
// - Removed `@reapit/connect-session` dependency only for types

import { ofetch } from 'ofetch'
import { decodeJWT } from 'unjwt'
import type { CoginitoAccess, ReapitConnectServerSessionInitializers } from './types'

export class ReapitConnectServerSession {
  // Private cached variables, I don't want users to reference these directly or it will get confusing.
  // and cause bugs
  private connectOAuthUrl: string
  private connectClientId: string
  private connectClientSecret: string
  private accessToken: string | null

  constructor({ connectClientId, connectClientSecret, connectOAuthUrl }: ReapitConnectServerSessionInitializers) {
    // Instantiate my private variables from either local storage or from the constructor params
    this.connectOAuthUrl = connectOAuthUrl
    this.connectClientId = connectClientId
    this.connectClientSecret = connectClientSecret
    this.accessToken = null
    this.connectAccessToken = this.connectAccessToken.bind(this)
  }

  // Check on access token to see if has expired - they last 1hr only before I need to refresh
  private get accessTokenExpired() {
    if (this.accessToken) {
      const decoded = decodeJWT<CoginitoAccess & { aud: string }>(this.accessToken)!
      const expiry = decoded.exp
      // 5mins to allow for clock drift
      const fiveMinsFromNow = Math.round(new Date().getTime() / 1000) + 300
      return expiry ? expiry < fiveMinsFromNow : true
    }

    return true
  }

  // See: https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
  private async connectGetAccessToken(): Promise<string | void> {
    try {
      // eslint-disable-next-line node/prefer-global/buffer
      const base64Encoded = Buffer.from(`${this.connectClientId}:${this.connectClientSecret}`).toString('base64')
      const session = await ofetch(
        `${this.connectOAuthUrl}/token?grant_type=client_credentials&client_id=${this.connectClientId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Encoded}`,
          },
        },
      )

      if (session.error)
        throw new Error(session.data.error)

      if (session?.access_token)
        return session.access_token

      throw new Error('No access token returned by Reapit Connect')
    }
    catch (error) {
      console.error('Reapit Connect Token Error', (error as any).message)
    }
  }

  // The main method for fetching an accessToken in an app.
  public async connectAccessToken(): Promise<string | void> {
    // Ideally, if I have a valid accessToken, just return it
    if (!this.accessTokenExpired)
      return this.accessToken!

    try {
      const accessToken = await this.connectGetAccessToken()

      if (accessToken) {
        // Cache the accessToken in memory for future use then return it to the user
        this.accessToken = accessToken
        return accessToken
      }

      throw new Error('No session returned from Reapit Connect')
    }
    catch (error) {
      console.error('Reapit Connect Session error', (error as any).message)
    }
  }
}
