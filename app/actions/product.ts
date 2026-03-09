'use server'

import {db, dietaryConstrains, productImages, productIngredients, products} from "@/src/db";
import {UploadFile} from "@/src/s3";
import {eq} from "drizzle-orm";

interface ProductImage {
  url: string;
  file: File;
  name: string;
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
  sellerId?: number;
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
      seller_id: formData.sellerId || null,
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
        amount: parseFloat(ingredient.amount) || 0,
        unit: ingredient.unit,
        stock: 0, // Default value
      }));
      console.log("ongridients",ingredientValues);

      await db.insert(productIngredients).values(ingredientValues);
    }

    // Handle image uploads
    if (formData.images && formData.images.length > 0) {
      // Upload images to S3 and get the URLs
      const imagePromises = formData.images.map(async (image, index) => {
        const key = productId+"_"+index
        const imageUrl = await UploadFile(key, image.file);
        return {
          product_id: productId,
          image_url: imageUrl,
          name: image.name || `Изображение ${index + 1}`,
          is_main: index === 0, // First image is the main image
          display_order: index,
          s3_key: key,
        };
      });

      // Wait for all uploads to complete
      const imageValues = await Promise.all(imagePromises);

      await db.insert(productImages).values(imageValues);
    }

    return { success: true, productId };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

interface UpdateProductImage {
  url: string;
  file?: File;
  name: string;
  isExisting?: boolean;
  s3_key?: string;
}

interface UpdateProductData {
  product_id: number;
  product_name: string;
  price: number;
  cost?: number;
  short_desc: string;
  long_desc: string;
  category: string;
  storage_conditions: string;
  stock: number;
  sku?: string;
  weight?: number;
  size?: string;
  shelf_life?: number;
  status?: string;
}

export async function updateProduct(formData: UpdateProductData, images: UpdateProductImage[]) {
  try {
    const updated = await db.update(products)
        .set({
          product_name: formData.product_name,
          price: formData.price,
          cost: formData.cost,
          short_desc: formData.short_desc,
          long_desc: formData.long_desc,
          category: formData.category,
          storage_conditions: formData.storage_conditions,
          stock: formData.stock,
          sku: formData.sku,
          weight: formData.weight,
          size: formData.size,
          shelf_life: formData.shelf_life,
          status: formData.status,
        })
        .where(eq(products.product_id, formData.product_id))
        .returning();

    if (!updated.length) {
      return {success: false, error: 'Product not found'};
    }

    // Replace all images: delete existing, then insert current set
    await db.delete(productImages).where(eq(productImages.product_id, formData.product_id));

    if (images.length > 0) {
      const imageValues = await Promise.all(
          images.map(async (image, index) => {
            let imageUrl = image.url;
            let s3Key = image.s3_key ?? `${formData.product_id}_edit_${index}`;

            if (image.file) {
              s3Key = `${formData.product_id}_${Date.now()}_${index}`;
              imageUrl = await UploadFile(s3Key, image.file);
            }

            return {
              product_id: formData.product_id,
              image_url: imageUrl,
              name: image.name,
              is_main: index === 0,
              display_order: index,
              s3_key: s3Key,
            };
          })
      );

      await db.insert(productImages).values(imageValues);
    }

    return {success: true};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating product:', message);
    return {success: false, error: message};
  }
}
