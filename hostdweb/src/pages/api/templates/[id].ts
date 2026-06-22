import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Template ID is required' });
    }

    if (req.method === 'GET') {
        try {
            const doc = await adminDb.collection('eventTemplates').doc(id).get();

            if (!doc.exists) {
                return res.status(404).json({ error: 'Template not found' });
            }

            return res.status(200).json({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data()?.createdAt?.toDate()?.toISOString(),
                updatedAt: doc.data()?.updatedAt?.toDate()?.toISOString(),
            });
        } catch (error: any) {
            console.error('Error fetching template:', error);
            return res.status(500).json({ error: error.message || 'Failed to fetch template' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updateData = {
                ...req.body,
                updatedAt: new Date(),
            };

            await adminDb.collection('eventTemplates').doc(id).update(updateData);

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error updating template:', error);
            return res.status(500).json({ error: error.message || 'Failed to update template' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            await adminDb.collection('eventTemplates').doc(id).delete();

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error deleting template:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete template' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
