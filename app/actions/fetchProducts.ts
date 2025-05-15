'use server'

import { db, products as productsTable, productImages } from "@/src/db";
import { eq } from "drizzle-orm";

// Define interface for product objects
interface Product {
  id: number;
  name: string;
  price: number;
  inventory: number;
  category: string;
  image: string;
  status: string;
  rating: number;
  sales: number;
}

// Helper function to get status text
function getStatusText(status: string | null | undefined): string {
  if (!status) return "Неизвестно";

  switch(status) {
    case "active": return "Активен";
    case "draft": return "Черновик";
    case "hidden": return "Скрыт";
    default: return status;
  }
}

export async function fetchProducts(): Promise<{ products: Product[], error: string | null }> {
  try {
    // Fetch products from the database
    const dbProducts = await db.select().from(productsTable)
      .leftJoin(productImages, eq(productsTable.product_id, productImages.product_id));

    // Transform the data to match the expected format
    const transformedProducts: Product[] = dbProducts.map(item => ({
      id: item.products.product_id,
      name: item.products.product_name,
      price: item.products.price,
      inventory: item.products.stock || 0,
      category: item.products.category,
      image: item.product_images?.url || "/placeholder.svg?height=200&width=200",
      status: getStatusText(item.products.status),
      rating: 4.5,
      sales: 0,
    }));

    return { products: transformedProducts, error: null };
  } catch (err) {
    console.error("Error fetching products:", err);
    return { products: [], error: "Failed to load products. Please try again later." };
  }
}