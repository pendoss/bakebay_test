import 'dotenv/config';
import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';

import {roleEnum, users} from './schema/users';
import {products} from './schema/products';
import {orders, orderStatusEnum} from './schema/orders';
import {orderItems} from './schema/order_items';
import {categories} from './schema/categories';
import {sellers} from './schema/sellers';
import {dietaryConstrains} from './schema/dietary_constrains';
import {productImages} from './schema/product_images';
import {productIngredients, stockStatusEnum} from './schema/product_ingredients';
import {reviews} from './schema/reviews';
import {customerOrders, customerOrderDerivedStatusEnum} from './schema/customer_orders';
import {
    sellerOrders,
    sellerOrderStatusEnum,
    sellerOrderStockCheckEnum,
    sellerOrderRefundStateEnum,
} from './schema/seller_orders';
import {sellerOrderItems} from './schema/seller_order_items';
import {
    customizationThreads,
    customizationOffers,
    customizationMessages,
    customizationFinalSpecs,
    customizationThreadStatusEnum,
    customizationMessageAuthorEnum,
} from './schema/customization_threads';
import {
    productOptionGroups,
    productOptionValues,
    sellerOrderItemOptionSelections,
    productOptionGroupKindEnum,
} from './schema/product_options';
import {sellerIngredientLibrary} from './schema/seller_ingredient_library';
import {
    sellerOrderIngredientReservations,
    reservationStateEnum,
} from './schema/seller_order_ingredient_reservations';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, {
    schema: {
        users,
        roleEnum,
        products,
        orders,
        orderStatusEnum,
        orderItems,
        categories,
        sellers,
        dietaryConstrains,
        productImages,
        productIngredients,
        stockStatusEnum,
        reviews,
        customerOrders,
        customerOrderDerivedStatusEnum,
        sellerOrders,
        sellerOrderStatusEnum,
        sellerOrderStockCheckEnum,
        sellerOrderRefundStateEnum,
        sellerOrderItems,
        customizationThreads,
        customizationOffers,
        customizationMessages,
        customizationFinalSpecs,
        customizationThreadStatusEnum,
        customizationMessageAuthorEnum,
        productOptionGroups,
        productOptionValues,
        sellerOrderItemOptionSelections,
        productOptionGroupKindEnum,
        sellerIngredientLibrary,
        sellerOrderIngredientReservations,
        reservationStateEnum,
    },
});

export {
    db,
    users,
    roleEnum,
    products,
    orders,
    orderStatusEnum,
    orderItems,
    categories,
    sellers,
    dietaryConstrains,
    productImages,
    productIngredients,
    stockStatusEnum,
    reviews,
    customerOrders,
    customerOrderDerivedStatusEnum,
    sellerOrders,
    sellerOrderStatusEnum,
    sellerOrderStockCheckEnum,
    sellerOrderRefundStateEnum,
    sellerOrderItems,
    customizationThreads,
    customizationOffers,
    customizationMessages,
    customizationFinalSpecs,
    customizationThreadStatusEnum,
    customizationMessageAuthorEnum,
    productOptionGroups,
    productOptionValues,
    sellerOrderItemOptionSelections,
    productOptionGroupKindEnum,
    sellerIngredientLibrary,
    sellerOrderIngredientReservations,
    reservationStateEnum,
};
