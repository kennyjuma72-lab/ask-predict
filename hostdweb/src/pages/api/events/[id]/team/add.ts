/**
 * TEAM COLLABORATION SYSTEM
 * Allows event hosts to add co-hosts and team members with role-based permissions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';

export interface TeamMember {
    id: string;
    eventId: string;
    userId: string;
    userEmail: string;
    userName: string;
    role: 'owner' | 'co-host' | 'editor' | 'viewer';
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canManageAttendees: boolean;
        canManageTeam: boolean;
        canViewAnalytics: boolean;
        canCheckIn: boolean;
    };
    addedAt: Timestamp;
    addedBy: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { userEmail, role } = req.body;

        if (!eventId || !userEmail || !role) {
            return res.status(400).json({ error: 'Event ID, user email, and role are required' });
        }

        // Define permissions based on role
        const rolePermissions = {
            'co-host': {
                canEdit: true,
                canDelete: false,
                canManageAttendees: true,
                canManageTeam: true,
                canViewAnalytics: true,
                canCheckIn: true,
            },
            'editor': {
                canEdit: true,
                canDelete: false,
                canManageAttendees: true,
                canManageTeam: false,
                canViewAnalytics: true,
                canCheckIn: true,
            },
            'viewer': {
                canEdit: false,
                canDelete: false,
                canManageAttendees: false,
                canManageTeam: false,
                canViewAnalytics: true,
                canCheckIn: false,
            },
        };

        // Check if user is already a team member
        const teamRef = collection(db, 'eventTeams');
        const existingQuery = query(
            teamRef,
            where('eventId', '==', eventId),
            where('userEmail', '==', userEmail)
        );
        const existingDocs = await getDocs(existingQuery);

        if (!existingDocs.empty) {
            return res.status(400).json({ error: 'User is already a team member' });
        }

        // Add team member
        const teamMember = {
            eventId,
            userEmail,
            userName: req.body.userName || userEmail,
            userId: req.body.userId || '',
            role,
            permissions: rolePermissions[role as keyof typeof rolePermissions] || rolePermissions.viewer,
            addedAt: Timestamp.now(),
            addedBy: req.body.addedBy || 'system',
        };

        const newMember = await addDoc(teamRef, teamMember);

        console.log(`✅ Added ${userEmail} as ${role} to event ${eventId}`);

        return res.status(200).json({
            success: true,
            memberId: newMember.id,
            message: 'Team member added successfully',
        });
    } catch (error: any) {
        console.error('Error adding team member:', error);
        return res.status(500).json({ error: error.message || 'Failed to add team member' });
    }
}
