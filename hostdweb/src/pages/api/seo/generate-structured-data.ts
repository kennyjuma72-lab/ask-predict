/**
 * SEO API - Generate Structured Data
 * POST /api/seo/generate-structured-data
 * 
 * Step 6.2: Generate JSON-LD structured data for event
 * Creates schema.org Event markup for rich snippets in Google
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { EventStructuredData } from '@/types/seo';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        // Get event data
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = eventDoc.data();

        // Build structured data
        const structuredData: EventStructuredData = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: event.title,
            description: event.description,
            startDate: event.startAt.toDate().toISOString(),
            endDate: event.endAt?.toDate().toISOString(),
            eventStatus: event.isCancelled ? 'EventCancelled' : 'EventScheduled',
            eventAttendanceMode: event.isVirtual
                ? 'OnlineEventAttendanceMode'
                : event.isHybrid
                    ? 'MixedEventAttendanceMode'
                    : 'OfflineEventAttendanceMode',

            // Location
            location: event.isVirtual
                ? {
                    '@type': 'VirtualLocation',
                    url: event.virtualLink || `https://yourplatform.com/events/${eventId}`
                }
                : {
                    '@type': 'Place',
                    name: event.location?.venueName || event.location,
                    address: event.location?.address ? {
                        '@type': 'PostalAddress',
                        streetAddress: event.location.address.street,
                        addressLocality: event.location.address.city,
                        addressRegion: event.location.address.state,
                        postalCode: event.location.address.zipCode,
                        addressCountry: event.location.address.country,
                    } : undefined
                },

            // Images
            image: event.imageUrl ? [event.imageUrl] : [],

            // Organizer
            organizer: {
                '@type': 'Organization',
                name: event.organizerName || 'Event Organizer',
                url: `https://yourplatform.com/hosts/${event.hostId}`
            },

            // Offers (tickets)
            offers: event.ticketTypes?.map((ticket: any) => ({
                '@type': 'Offer',
                price: ticket.price.toString(),
                priceCurrency: 'USD',
                availability: event.soldOut ? 'SoldOut' : 'InStock',
                url: `https://yourplatform.com/events/${eventId}/register`,
                validFrom: event.createdAt.toDate().toISOString(),
            })) || [],

            // Aggregate rating (if reviews exist)
            aggregateRating: event.averageRating ? {
                '@type': 'AggregateRating',
                ratingValue: event.averageRating,
                reviewCount: event.totalReviews || 0,
            } : undefined,
        };

        return res.status(200).json({
            success: true,
            structuredData,
            scriptTag: `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`
        });

    } catch (error: any) {
        console.error('Error generating structured data:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate structured data' });
    }
}
