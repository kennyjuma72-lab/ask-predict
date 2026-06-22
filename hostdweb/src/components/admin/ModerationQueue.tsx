/**
 * CONTENT MODERATION - Moderation Queue Component
 * View and manage reported content
 */

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ContentReport {
    id: string;
    reportedBy: string;
    reportedUserId: string;
    contentType: 'event' | 'user' | 'comment';
    contentId: string;
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
    action?: 'none' | 'warning' | 'suspend' | 'ban' | 'delete';
}

const ModerationQueue: React.FC = () => {
    const [reports, setReports] = useState<ContentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
    const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            const reportsRef = collection(db, 'contentReports');
            let q = query(reportsRef);

            if (filter !== 'all') {
                q = query(reportsRef, where('status', '==', filter));
            }

            const snapshot = await getDocs(q);
            const reportsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ContentReport));

            setReports(reportsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reportId: string, action: 'warning' | 'suspend' | 'ban' | 'delete' | 'dismiss') => {
        if (!confirm(`Are you sure you want to ${action} this content/user?`)) return;

        try {
            const reportRef = doc(db, 'contentReports', reportId);
            const report = reports.find(r => r.id === reportId);

            // Update report
            await updateDoc(reportRef, {
                status: action === 'dismiss' ? 'dismissed' : 'resolved',
                action,
                reviewedAt: Timestamp.now(),
                reviewedBy: 'currentAdmin', // Replace with actual admin ID
            });

            // If banning or suspending, create ban record
            if ((action === 'ban' || action === 'suspend') && report) {
                await addDoc(collection(db, 'userBans'), {
                    userId: report.reportedUserId,
                    reason: report.description,
                    bannedBy: 'currentAdmin',
                    bannedAt: Timestamp.now(),
                    expiresAt: action === 'suspend' ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : null,
                    type: action,
                    active: true,
                });
            }

            alert(`✅ Action "${action}" completed successfully!`);
            fetchReports();
            setSelectedReport(null);
        } catch (error) {
            console.error('Error taking action:', error);
            alert('Failed to complete action');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading reports...</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Moderation</h2>
                <p className="text-gray-600">Review and manage reported content</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    All ({reports.length})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('reviewed')}
                    className={`px-4 py-2 rounded-md ${filter === 'reviewed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    Reviewed
                </button>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No reports found
                                </td>
                            </tr>
                        ) : (
                            reports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                            {report.contentType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{report.reason}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{report.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(report.createdAt.seconds * 1000).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${report.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {report.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(report.id, 'warning')}
                                                    className="text-yellow-600 hover:text-yellow-900 text-sm"
                                                >
                                                    Warn
                                                </button>
                                                <button
                                                    onClick={() => handleAction(report.id, 'suspend')}
                                                    className="text-orange-600 hover:text-orange-900 text-sm"
                                                >
                                                    Suspend
                                                </button>
                                                <button
                                                    onClick={() => handleAction(report.id, 'ban')}
                                                    className="text-red-600 hover:text-red-900 text-sm"
                                                >
                                                    Ban
                                                </button>
                                                <button
                                                    onClick={() => handleAction(report.id, 'dismiss')}
                                                    className="text-gray-600 hover:text-gray-900 text-sm"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModerationQueue;
