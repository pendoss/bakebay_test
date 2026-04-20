export type Brand<T, B extends string> = T & { readonly __brand: B }

export type ProductId = Brand<number, 'ProductId'>
export type OrderId = Brand<number, 'OrderId'>
export type OrderItemId = Brand<number, 'OrderItemId'>
export type UserId = Brand<number, 'UserId'>
export type SellerId = Brand<number, 'SellerId'>
export type IngredientId = Brand<number, 'IngredientId'>
export type CustomerOrderId = Brand<number, 'CustomerOrderId'>
export type SellerOrderId = Brand<number, 'SellerOrderId'>
export type SellerOrderItemId = Brand<number, 'SellerOrderItemId'>
export type CustomizationThreadId = Brand<number, 'CustomizationThreadId'>
export type CustomizationOfferId = Brand<number, 'CustomizationOfferId'>
export type CustomizationMessageId = Brand<number, 'CustomizationMessageId'>
export type ProductOptionGroupId = Brand<number, 'ProductOptionGroupId'>
export type ProductOptionValueId = Brand<number, 'ProductOptionValueId'>

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

export function asCustomerOrderId(value: number): CustomerOrderId {
    return value as CustomerOrderId
}

export function asSellerOrderId(value: number): SellerOrderId {
    return value as SellerOrderId
}

export function asSellerOrderItemId(value: number): SellerOrderItemId {
    return value as SellerOrderItemId
}

export function asCustomizationThreadId(value: number): CustomizationThreadId {
    return value as CustomizationThreadId
}

export function asCustomizationOfferId(value: number): CustomizationOfferId {
    return value as CustomizationOfferId
}

export function asCustomizationMessageId(value: number): CustomizationMessageId {
    return value as CustomizationMessageId
}

export function asProductOptionGroupId(value: number): ProductOptionGroupId {
    return value as ProductOptionGroupId
}

export function asProductOptionValueId(value: number): ProductOptionValueId {
    return value as ProductOptionValueId
}
