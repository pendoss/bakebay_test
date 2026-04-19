export type Brand<T, B extends string> = T & { readonly __brand: B }

export type ProductId = Brand<number, 'ProductId'>
export type OrderId = Brand<number, 'OrderId'>
export type OrderItemId = Brand<number, 'OrderItemId'>
export type UserId = Brand<number, 'UserId'>
export type SellerId = Brand<number, 'SellerId'>
export type IngredientId = Brand<number, 'IngredientId'>

export function asProductId(value: number): ProductId {
    return value as ProductId
}

export function asOrderId(value: number): OrderId {
    return value as OrderId
}

export function asOrderItemId(value: number): OrderItemId {
    return value as OrderItemId
}

export function asUserId(value: number): UserId {
    return value as UserId
}

export function asSellerId(value: number): SellerId {
    return value as SellerId
}

export function asIngredientId(value: number): IngredientId {
    return value as IngredientId
}
