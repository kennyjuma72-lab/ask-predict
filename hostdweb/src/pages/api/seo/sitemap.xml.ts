/**
 * SEO API - Generate Sitemap
 * GET /api/seo/sitemap.xml
 * 
 * Step 6.3: Generate XML sitemap for all events
 * Helps search engines discover and index event pages
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourplatform.com';

        // Get all public events
        const eventsQuery = query(
            collection(db, 'events'),
            where('isPublished', '==', true),
            where('isDeleted', '==', false)
        );

        const eventsSnapshot = await getDocs(eventsQuery);

        // Build sitemap XML
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Homepage
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}</loc>\n`;
        sitemap += '    <changefreq>daily</changefreq>\n';
        sitemap += '    <priority>1.0</priority>\n';
        sitemap += '  </url>\n';

        // Browse page
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/events</loc>\n`;
        sitemap += '    <changefreq>hourly</changefreq>\n';
        sitemap += '    <priority>0.9</priority>\n';
        sitemap += '  </url>\n';

        // Individual events
        eventsSnapshot.docs.forEach(doc => {
            const event = doc.data();
            const eventUrl = `${baseUrl}/events/${doc.id}`;
            const lastMod = event.updatedAt?.toDate().toISOString().split('T')[0] ||
                event.createdAt?.toDate().toISOString().split('T')[0];

            sitemap += '  <url>\n';
            sitemap += `    <loc>${eventUrl}</loc>\n`;
            sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
            sitemap += '    <changefreq>weekly</changefreq>\n';
            sitemap += '    <priority>0.8</priority>\n';
            sitemap += '  </url>\n';
        });

        sitemap += '</urlset>';

        // Set proper headers for XML
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        return res.status(200).send(sitemap);

    } catch (error: any) {
        console.error('Error generating sitemap:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate sitemap' });
    }
}
