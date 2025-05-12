import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Import all schemas
import { users, roleEnum } from './schema/users';
import { products } from './schema/products';
import { orders, orderStatusEnum } from './schema/orders';
import { orderItems } from './schema/order_items';
import { categories } from './schema/categories';
import { sellers } from './schema/sellers';
import { dietaryConstrains } from './schema/dietary_constrains';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// Create a Drizzle ORM instance
const db = drizzle(pool);

// Export the db instance and all schemas
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
  dietaryConstrains
};
