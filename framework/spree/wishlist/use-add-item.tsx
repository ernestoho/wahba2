import { useCallback } from 'react'
import type { MutationHook } from '@commerce/utils/types'
import useAddItem from '@commerce/wishlist/use-add-item'
import type { UseAddItem } from '@commerce/wishlist/use-add-item'
import useWishlist from './use-wishlist'
import type { ExplicitWishlistAddItemHook } from '@framework/types'
import type {
  WishedItem,
  WishlistsAddWishedItem,
} from '@spree/storefront-api-v2-sdk/types/interfaces/WishedItem'
import type { GraphQLFetcherResult } from '@commerce/api'
import ensureIToken from '@framework/utils/tokens/ensure-itoken'
import type { IToken } from '@spree/storefront-api-v2-sdk/types/interfaces/Token'
import type { AddItemHook } from '@commerce/types/wishlist'
import isLoggedIn from '@framework/utils/tokens/is-logged-in'

export default useAddItem as UseAddItem<typeof handler>

export const handler: MutationHook<ExplicitWishlistAddItemHook> = {
  fetchOptions: {
    url: 'wishlists',
    query: 'addWishedItem',
  },
  async fetcher({ input, options, fetch }) {
    console.info(
      'useAddItem (wishlist) fetcher called. Configuration: ',
      'input: ',
      input,
      'options: ',
      options
    )

    const {
      item: { productId, variantId, wishlistToken },
    } = input

    if (!isLoggedIn() || !wishlistToken) {
      return null
    }

    let token: IToken | undefined = ensureIToken()

    const addItemParameters: WishlistsAddWishedItem = {
      variant_id: `${variantId}`,
      quantity: 1,
    }

    await fetch<GraphQLFetcherResult<WishedItem>>({
      variables: {
        methodPath: 'wishlists.addWishedItem',
        arguments: [token, wishlistToken, addItemParameters],
      },
    })

    return null
  },
  useHook: ({ fetch }) => {
    const useWrappedHook: ReturnType<MutationHook<AddItemHook>['useHook']> =
      () => {
        const wishlist = useWishlist()

        return useCallback(
          async (item) => {
            if (!wishlist.data) {
              return null
            }

            const data = await fetch({
              input: {
                item: {
                  ...item,
                  wishlistToken: wishlist.data.token,
                },
              },
            })

            await wishlist.revalidate()

            return data
          },
          [wishlist]
        )
      }

    return useWrappedHook
  },
}
