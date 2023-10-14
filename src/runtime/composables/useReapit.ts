import { computed } from 'vue'
import { hash } from 'ohash'
import type { FetchError } from 'ofetch'
import type { NitroFetchOptions } from 'nitropack'
import type { WatchSource } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import { useAsyncData } from '#imports'

type UseReapitOptions<T> = AsyncDataOptions<T> & Pick<
  NitroFetchOptions<string>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  | 'query'
  | 'retry'
  | 'retryDelay'
  | 'timeout'
> & {
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
      if ((nuxt!.isHydrating || cache) && key.value in nuxt!.payload.data)
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
          },
        })) as T

        if (cache)
          nuxt!.payload.data[key.value] = result

        return result
      }
      catch (error) {
        // Invalidate cache if request fails
        if (key.value in nuxt!.payload.data)
          delete nuxt!.payload.data[key.value]

        throw error
      }
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError>
}
