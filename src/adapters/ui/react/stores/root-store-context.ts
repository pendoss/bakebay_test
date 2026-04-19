'use client'

import {createContext} from 'react'
import type {UserStore} from './user-store'
import type {CartStore} from './cart-store'

export interface RootStore {
    userStore: UserStore
    cartStore: CartStore
}

export const RootStoreContext = createContext<RootStore | null>(null)
