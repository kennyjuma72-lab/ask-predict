/**
 * CONTENT MODERATION - Moderation Queue Page
 * Admin page for reviewing reported content
 */

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AdminLayout } from '../components/AdminLayout';
import { Breadcrumb } from '../components';
import { useToast } from '../components/Toast';

interface ContentReport {
    id: string;
    reportedBy: string;
    reportedUserId: string;
    reportedUserEmail?: string;
    contentType: 'event' | 'user' | 'comment';
    contentId: string;
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: any;
    reviewedAt?: any;
    reviewedBy?: string;
    action?: 'none' | 'warning' | 'suspend' | 'ban' | 'delete';
}

export default function ModerationPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<ContentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

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

            setReports(reportsData.sort((a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            ));
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
                reviewedBy: 'admin', // Replace with actual admin ID from auth
            });

            // If banning or suspending, create ban record
            if ((action === 'ban' || action === 'suspend') && report) {
                const expiresAt = action === 'suspend'
                    ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    : null;

                await addDoc(collection(db, 'userBans'), {
                    userId: report.reportedUserId,
                    reason: report.description,
                    bannedBy: 'admin',
                    bannedAt: Timestamp.now(),
                    expiresAt,
                    type: action,
                    active: true,
                });
            }

            toast(`Action "${action}" completed successfully!`, 'success');
            fetchReports();
        } catch (error) {
            console.error('Error taking action:', error);
            toast('Failed to complete action', 'error');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Breadcrumb */}
                <Breadcrumb items={[{ label: 'Moderation' }]} />

                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
                    <p className="text-gray-600">Review and manage reported content</p>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'pending'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Pending {reports.filter(r => r.status === 'pending').length > 0 && `(${reports.filter(r => r.status === 'pending').length})`}
                    </button>
                    <button
                        onClick={() => setFilter('reviewed')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'reviewed'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Reviewed
                    </button>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <p className="text-gray-500">No reports found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {report.contentType}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${report.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.reason}</h3>
                                        <p className="text-gray-600 mb-2">{report.description}</p>
                                        <div className="text-sm text-gray-500">
                                            <p>Reported: {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}</p>
                                            <p>Content ID: {report.contentId}</p>
                                            <p>Reported User: {report.reportedUserEmail || report.reportedUserId}</p>
                                        </div>
                                    </div>
                                </div>

                                {report.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleAction(report.id, 'warning')}
                                            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 font-medium"
                                        >
                                            ⚠️ Warn
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'suspend')}
                                            className="px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 font-medium"
                                        >
                                            ⏸️ Suspend 30d
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'ban')}
                                            className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 font-medium"
                                        >
                                            🚫 Ban Permanently
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'dismiss')}
                                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 font-medium ml-auto"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}

                                {report.status !== 'pending' && report.action && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            Action taken: <span className="font-medium">{report.action}</span>
                                            {report.reviewedAt?.seconds && ` on ${new Date(report.reviewedAt.seconds * 1000).toLocaleString()}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
