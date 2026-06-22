/**
 * Virtual Event API - Create Zoom Meeting
 * POST /api/virtual-events/create-zoom-meeting
 * 
 * Step 10.2: Create Zoom meeting for virtual event
 * Uses Zoom API to programmatically create meetings
 * 
 * Setup Required:
 * 1. Create Zoom App at https://marketplace.zoom.us/
 * 2. Get API Key and Secret
 * 3. Add to environment variables:
 *    ZOOM_API_KEY=your_key
 *    ZOOM_API_SECRET=your_secret
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import axios from 'axios';
import jwt from 'jsonwebtoken';

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
            title,
            description,
            scheduledStart,
            duration, // in minutes
            hostEmail,
            settings = {}
        } = req.body;

        if (!eventId || !title || !scheduledStart || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate Zoom JWT token
        const zoomToken = generateZoomJWT();

        // Create Zoom meeting
        const zoomResponse = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: title,
                type: 2, // Scheduled meeting
                start_time: new Date(scheduledStart).toISOString(),
                duration,
                timezone: 'UTC',
                agenda: description,
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: settings.muteOnEntry !== false,
                    waiting_room: settings.enableWaitingRoom !== false,
                    auto_recording: settings.enableRecording ? 'cloud' : 'none',
                    allow_multiple_devices: true,

                    registrants_email_notification: false,
                    meeting_authentication: false,
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${zoomToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const meeting = zoomResponse.data;

        // Store virtual event in Firestore
        const virtualEventData = {
            eventId,
            platform: 'zoom' as const,
            platformMeetingId: meeting.id.toString(),
            joinUrl: meeting.join_url,
            startUrl: meeting.start_url,
            password: meeting.password,
            settings: {
                enableWaitingRoom: settings.enableWaitingRoom !== false,
                enableRecording: settings.enableRecording || false,
                enableChat: settings.enableChat !== false,
                enableQnA: settings.enableQnA || false,
                enablePolls: settings.enablePolls || false,
                enableBreakoutRooms: settings.enableBreakoutRooms || false,
                muteOnEntry: settings.muteOnEntry !== false,
                requireRegistration: false,
                maxParticipants: 100,
            },
            accessType: 'ticket_holders' as const,
            recordingAvailable: false,
            stats: {
                totalRegistrants: 0,
                totalAttendees: 0,
                peakConcurrent: 0,
                averageDuration: 0,
                chatMessages: 0,
                qnaQuestions: 0,
            },
            status: 'scheduled' as const,
            zoomData: {
                meetingNumber: meeting.id.toString(),
                timezone: meeting.timezone,
                duration,
                hostEmail: meeting.host_email,
            },
            scheduledStart: Timestamp.fromDate(new Date(scheduledStart)),
            scheduledEnd: Timestamp.fromDate(new Date(new Date(scheduledStart).setMinutes(new Date(scheduledStart).getMinutes() + duration))),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'virtualEvents'), virtualEventData);

        return res.status(201).json({
            success: true,
            virtualEventId: docRef.id,
            meetingId: meeting.id,
            joinUrl: meeting.join_url,
            startUrl: meeting.start_url,
            password: meeting.password,
            message: 'Zoom meeting created successfully'
        });

    } catch (error: any) {
        console.error('Error creating Zoom meeting:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                error: error.response.data.message || 'Zoom API error'
            });
        }

        return res.status(500).json({ error: error.message || 'Failed to create Zoom meeting' });
    }
}

/**
 * Generate Zoom JWT token for API authentication
 */
function generateZoomJWT(): string {
    const apiKey = process.env.ZOOM_API_KEY;
    const apiSecret = process.env.ZOOM_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('Zoom API credentials not configured');
    }

    const payload = {
        iss: apiKey,
        exp: Date.now() + 60000, // 1 minute expiry
    };

    return jwt.sign(payload, apiSecret);
}
