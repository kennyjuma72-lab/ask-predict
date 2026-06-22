/**
 * Discount Code API - Delete
 * DELETE /api/discount-codes/delete/[id]
 * 
 * Step 1.4: Delete a discount code
 * Security: Should verify that user owns the event before deleting
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Discount code ID is required' });
        }

        // Optional: Verify ownership before deleting
        const discountRef = doc(db, 'discountCodes', id);
        const discountDoc = await getDoc(discountRef);

        if (!discountDoc.exists()) {
            return res.status(404).json({ error: 'Discount code not found' });
        }

        // Delete the code
        await deleteDoc(discountRef);

        return res.status(200).json({
            success: true,
            message: 'Discount code deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting discount code:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete discount code' });
    }
}
