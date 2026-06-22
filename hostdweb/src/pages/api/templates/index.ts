import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { hostId } = req.query;

            if (!hostId || typeof hostId !== 'string') {
                return res.status(400).json({ error: 'Host ID is required' });
            }

            const templatesSnapshot = await adminDb
                .collection('eventTemplates')
                .where('hostId', '==', hostId)
                .orderBy('createdAt', 'desc')
                .get();

            const templates = templatesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()?.toISOString(),
                updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
            }));

            return res.status(200).json(templates);
        } catch (error: any) {
            console.error('Error fetching templates:', error);
            return res.status(500).json({ error: error.message || 'Failed to fetch templates' });
        }
    }

    if (req.method === 'POST') {
        try {
            const templateData = req.body;

            if (!templateData.hostId) {
                return res.status(400).json({ error: 'Host ID is required' });
            }

            const newTemplate = {
                ...templateData,
                usageCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const docRef = await adminDb.collection('eventTemplates').add(newTemplate);

            return res.status(201).json({
                id: docRef.id,
                ...newTemplate,
            });
        } catch (error: any) {
            console.error('Error creating template:', error);
            return res.status(500).json({ error: error.message || 'Failed to create template' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
