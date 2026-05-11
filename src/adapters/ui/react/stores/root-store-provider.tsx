'use client'

import {type ReactNode, useEffect, useState} from 'react'
import {UserStore} from './user-store'
import {CartStore} from './cart-store'
import {cartStorageLocal} from '@/src/adapters/storage/browser/cart-storage-local'
import {type RootStore, RootStoreContext} from './root-store-context'

export function RootStoreProvider({children}: { children: ReactNode }) {
    const [store] = useState<RootStore>(() => ({
        userStore: new UserStore(),
        cartStore: new CartStore(cartStorageLocal()),
    }))

    useEffect(() => {
        store.userStore.init()
        store.cartStore.init()
    }, [store])

    return (
        <RootStoreContext.Provider value={store}>
            {children}
        </RootStoreContext.Provider>
    )
}
