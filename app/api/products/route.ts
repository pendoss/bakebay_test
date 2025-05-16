import { NextResponse } from 'next/server';
import { db, products, sellers, categories, dietaryConstrains } from '@/src/db';
import { productImages } from '@/src/db/schema/product_images';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const categoryId = url.searchParams.get('category');
  const sellerId = url.searchParams.get('seller');
  console.log('url', url);
  console.log('id', id);
  try {

    // If ID is provided, return a single product
    if (id) {
      try {
        // Get the product with related data
        console.log(id)
        const product = await db.query.products.findFirst({
          where: eq(products.product_id, parseInt(id)),
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        // Get product images
        const images = await db.select()
          .from(productImages)
          .where(eq(productImages.product_id, parseInt(id)))
          .orderBy(productImages.is_main, productImages.display_order);

        // Create response with images
        const productWithImages = {
          ...product,
          images: images,
          // Use the main image as the primary image, or the first image if no main image is set
          image: images.find(img => img.is_main)?.image_url || 
                 (images.length > 0 ? images[0].image_url : null)
        };

        return NextResponse.json(productWithImages);
      } catch (error) {
        console.error('Error fetching product by ID:', error);
        return NextResponse.json(
          { error: 'Failed to fetch product', details: error },
          { status: 500 }
        );
      }
    }

    // Build query based on filters
    let query = db.select().from(products).where( categoryId ? eq(products.category_id, parseInt(categoryId)) : sellerId ? eq(products.seller_id, parseInt(sellerId)) : undefined);

    // Execute query
    const allProducts = await query.leftJoin(sellers, eq(products.seller_id, sellers.seller_id)).leftJoin(categories, eq(products.category_id, categories.id));

    // Format the response
    const formattedProducts = await Promise.all(allProducts.map(async row => {
      // Get dietary constraints for each product
      const dietaryConstraints = await db.select({
        id: dietaryConstrains.id,
        name: dietaryConstrains.name,
      })
      .from(dietaryConstrains)
      .where(eq(dietaryConstrains.product_id, row.products.product_id));

      // Get product images
      const images = await db.select()
        .from(productImages)
        .where(eq(productImages.product_id, row.products.product_id))
        .orderBy(productImages.is_main, productImages.display_order);

      // Find main image or use first image
      const mainImage = images.find(img => img.is_main)?.image_url || 
                        (images.length > 0 ? images[0].image_url : null);

      return {
        id: row.products.product_id,
        name: row.products.product_name,
        price: row.products.price,
        short_desc: row.products.short_desc,
        long_desc: row.products.long_desc,
        category: row.products.category,
        storage_conditions: row.products.storage_conditions,
        stock: row.products.stock,
        seller: row.sellers ? {
          id: row.sellers.seller_id,
          name: row.sellers.seller_name,
          rating: row.sellers.seller_rating,
        } : null,
        category_info: row.categories ? {
          id: row.categories.id,
          name: row.categories.name,
        } : null,
        dietary_constraints: dietaryConstraints,
        images: images,
        image: mainImage,
      };
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products: ', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.product_name || !body.price || !body.short_desc || !body.long_desc || 
        !body.category || !body.storage_conditions || !body.seller_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if seller exists
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.seller_id, body.seller_id),
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Create new product
    const newProduct = await db.insert(products).values({
      seller_id: body.seller_id,
      product_name: body.product_name,
      price: body.price,
      short_desc: body.short_desc,
      long_desc: body.long_desc,
      category: body.category,
      storage_conditions: body.storage_conditions,
      stock: body.stock || 0,
      category_id: body.category_id,
    }).returning();

    return NextResponse.json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.product_id) {
      return NextResponse.json(
        { error: 'Missing product ID' },
        { status: 400 }
      );
    }

    // Update product
    const updatedProduct = await db.update(products)
      .set({
        product_name: body.product_name,
        price: body.price,
        short_desc: body.short_desc,
        long_desc: body.long_desc,
        category: body.category,
        storage_conditions: body.storage_conditions,
        stock: body.stock,
        seller_id: body.seller_id,
        category_id: body.category_id,
      })
      .where(eq(products.product_id, body.product_id))
      .returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing product ID' },
        { status: 400 }
      );
    }

    // Delete product
    const deletedProduct = await db.delete(products)
      .where(eq(products.product_id, parseInt(id)))
      .returning();

    if (deletedProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
