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
    const dbProducts = await db.select().from(productsTable);
    const transformedProducts: Product[] = await Promise.all(dbProducts.map(async product => {
      const images = await db.select()
        .from(productImages)
        .where(eq(productImages.product_id, product.product_id))
        .orderBy(productImages.is_main, productImages.display_order);

      // Find main image or use first image
      const mainImage = images.find(img => img.is_main)?.image_url || 
                        (images.length > 0 ? images[0].image_url : null);

      return {
        id: product.product_id,
        name: product.product_name,
        price: product.price,
        inventory: product.stock || 0,
        category: product.category,
        image: mainImage || "/placeholder.svg?height=200&width=200",
        status: getStatusText(product.status),
        rating: 4.5,
        sales: 0,
      };
    }));

    return { products: transformedProducts, error: null };
  } catch (err) {
    console.error("Error fetching products:", err);
    return { products: [], error: "Failed to load products. Please try again later." };
  }
}
