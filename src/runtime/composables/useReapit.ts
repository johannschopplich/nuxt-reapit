import { computed } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ofetch'
import type { NitroFetchOptions } from 'nitropack'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import { useAsyncData } from '#imports'

type UseReapitOptions<T> = AsyncDataOptions<T> & Pick<
  NitroFetchOptions<string>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  | 'query'
  | 'headers'
  | 'retry'
  | 'retryDelay'
  | 'timeout'
> & {
  /**
   * The customer ID to use when making requests.
   *
   * @see https://foundations-documentation.reapit.cloud/api/api-documentation#accessing-customer-data
   * @default 'SBOX'
   */
  customerId?: string
  /**
   * Cache the response between function calls for the same path.
   * @default false
   */
  cache?: boolean
}

export function useReapit<T = any>(
  path: string,
  opts: UseReapitOptions<T> = {},
) {
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch,
    immediate,
    query,
    headers,
    customerId = 'SBOX',
    cache = false,
    ...fetchOptions
  } = opts

  const key = computed(() => `$reapit${hash([path, query])}`)

  const asyncDataOptions: AsyncDataOptions<T> = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch,
    immediate,
  }

  let controller: AbortController | undefined

  return useAsyncData<T, FetchError>(
    key.value,
    async (nuxt) => {
      controller?.abort?.()

      // Workaround to persist response client-side
      // https://github.com/nuxt/nuxt/issues/15445
      if ((nuxt!.isHydrating || cache) && nuxt!.payload.data[key.value])
        return nuxt!.payload.data[key.value]

      controller = new AbortController()

      try {
        const result = (await globalThis.$fetch<T>(`/api/__reapit/${key.value}`, {
          ...fetchOptions,
          signal: controller.signal,
          method: 'POST',
          body: {
            path,
            query,
            headers: {
              ...headersToObject(headers),
              'reapit-customer': customerId,
            },
          },
        })) as T

        if (cache)
          nuxt!.payload.data[key.value] = result

        return result
      }
      catch (error) {
        // Invalidate cache if request fails
        nuxt!.payload.data[key.value] = undefined

        throw error
      }
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError>
}

function headersToObject(headers: HeadersInit = {}): Record<string, string> {
  if (headers instanceof Headers || Array.isArray(headers))
    return Object.fromEntries(headers)

  return headers
}
