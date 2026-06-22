/**
 * Merchandising API - Create Product
 * POST /api/merchandising/create-product
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            eventId,
            name,
            description,
            category,
            basePrice,
            hasVariants,
            variants,
            trackInventory,
            totalStock,
            requiresShipping,
            images,
            primaryImage
        } = req.body;

        if (!eventId || !name || basePrice == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const productData = {
            eventId,
            name,
            description: description || '',
            category: category || 'other',
            basePrice: Number(basePrice),
            currency: 'USD',
            images: images || [],
            primaryImage: primaryImage || '',
            hasVariants: hasVariants || false,
            variants: variants || [],
            trackInventory: trackInventory !== false,
            totalStock: Number(totalStock) || 0,
            lowStockThreshold: 10,
            available: true,
            requiresShipping: requiresShipping !== false,
            weight: 0,
            stats: {
                totalSold: 0,
                totalRevenue: 0,
                averageRating: 0,
                reviewCount: 0
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'eventProducts'), productData);

        return res.status(201).json({
            success: true,
            productId: docRef.id,
            message: 'Product created successfully'
        });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: error.message });
    }
}
