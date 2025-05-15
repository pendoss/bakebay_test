'use server'

import { db, products, productImages, productIngredients, dietaryConstrains } from "@/src/db";

interface ProductImage {
  url: string;
  name: string;
  // file is not needed on the server side
}

interface ProductIngredient {
  name: string;
  amount: string;
  unit: string;
}

interface Product {
  name: string;
  description: string;
  category: string;
  status: string;
  price: number;
  cost: number;
  inventory: number;
  sku: string;
  weight: number;
  size: string;
  storageInstructions: string;
  shelfLife: number;
  trackInventory: boolean;
  lowStockAlert: boolean;
  dietaryInfo: string[];
  images: ProductImage[];
  ingredients: ProductIngredient[];
}

export async function createProduct(formData: Partial<Product>) {
  try {
    // Insert product into database
    console.log("formData",formData);
    const [productResult] = await db.insert(products).values({
      product_name: formData.name || '',
      price: formData.price || 0,
      cost: formData.cost || 0,
      short_desc: formData.description?.substring(0, 100) || '',
      long_desc: formData.description || '',
      category: formData.category || '',
      storage_conditions: formData.storageInstructions || '',
      stock: formData.inventory || 0,
      sku: formData.sku || '',
      weight: formData.weight || 0,
      size: formData.size || '',
      shelf_life: formData.shelfLife || 0,
      track_inventory: formData.trackInventory ?? true,
      low_stock_alert: formData.lowStockAlert ?? false,
      status: formData.status || 'active',
      seller_id: 1, // Assuming a default seller ID for now
    }).returning({ product_id: products.product_id });

    const productId = productResult.product_id;

    // Insert dietary constraints
    if (formData.dietaryInfo && formData.dietaryInfo.length > 0) {
      const dietaryValues = formData.dietaryInfo.map(info => ({
        name: info,
        product_id: productId
      }));

      await db.insert(dietaryConstrains).values(dietaryValues);
    }

    // Insert ingredients
    if (formData.ingredients && formData.ingredients.length > 0) {
      const ingredientValues = formData.ingredients.map(ingredient => ({
        product_id: productId,
        name: ingredient.name,
        unit: ingredient.unit,
        stock: 0, // Default value
      }));
      console.log("ongridients",ingredientValues);

      await db.insert(productIngredients).values(ingredientValues);
    }

    // Handle image uploads
    if (formData.images && formData.images.length > 0) {
      // In a real application, you would upload the images to a storage service
      // and then store the URLs in the database
      const imageValues = formData.images.map((image, index) => ({
        product_id: productId,
        url: image.url || '/placeholder.svg',
        name: image.name || `Изображение ${index + 1}`,
        is_main: index === 0, // First image is the main image
        display_order: index,
      }));

      await db.insert(productImages).values(imageValues);
    }

    return { success: true, productId };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}
