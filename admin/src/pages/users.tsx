import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Card, CardHeader, CardBody, Breadcrumb, Badge, DataTable } from '../components';
import { useToast } from '../components/Toast';
import { PaymentModal } from '../components/PaymentModal';
import { HostApplicationModal } from '../components/HostApplicationModal';
import { getAllUsers, getUserStats, updateUserRole, updateHostApplication, suspendUser, approveHostApplication, rejectHostApplication, recordPayment } from '../services/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingHosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHostApplicationModal, setShowHostApplicationModal] = useState(false);
  const [selectedHostApplication, setSelectedHostApplication] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getUserStats()
        ]);
        setUsers(usersData);
        setUserStats(statsData);
      } catch (error) {
        console.error('Error fetching users data:', error);
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = String(error);
        }
        toast('Error fetching users data: ' + errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          hostApplication: data.hostApplication ? {
            ...data.hostApplication,
            appliedAt: data.hostApplication.appliedAt?.toDate()
          } : null
        };
      });
      
      const totalUsers = snapshot.size;
      const activeUsers = snapshot.docs.filter(doc => !doc.data().isSuspended).length;
      const pendingHosts = snapshot.docs.filter(doc => doc.data().hostApplication?.status === 'pending').length;
      
      setUsers(usersData);
      setUserStats({ totalUsers, activeUsers, pendingHosts });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast(`Role updated to ${newRole}! Mobile app should update automatically.`, 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast('Failed to update user role', 'error');
    }
  };

  const handleReviewHostApplication = async (userId: string, status: string, rejectionReason?: string) => {
    try {
      await updateHostApplication(userId, status, rejectionReason);
      setUsers(users.map(user => 
        user.id === userId ? { 
          ...user, 
          hostApplication: { ...user.hostApplication, status },
          role: status === 'approved' ? 'host' : user.role
        } : user
      ));
      toast(`Host application ${status}!`, 'success');
    } catch (error) {
      console.error('Error reviewing host application:', error);
      toast('Failed to review host application', 'error');
    }
  };

  const handleSuspendUser = async (userId: string, isSuspended: boolean) => {
    try {
      await suspendUser(userId, isSuspended);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isSuspended } : user
      ));
      toast(`User ${isSuspended ? 'suspended' : 'reactivated'}`, 'success');
    } catch (error) {
      console.error('Error suspending user:', error);
      toast('Failed to suspend user', 'error');
    }
  };

  const handleApproveHost = async (userId: string) => {
    try {
      await approveHostApplication(userId);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: 'host', hostApplication: { ...user.hostApplication, status: 'approved' } } : user
      ));
      toast('Host application approved successfully!', 'success');
    } catch (error) {
      console.error('Error approving host application:', error);
      toast('Failed to approve host application', 'error');
    }
  };

  const handleRejectHost = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast('Please provide a reason for rejection', 'error');
      return;
    }
    try {
      await rejectHostApplication(userId, rejectionReason);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, hostApplication: { ...user.hostApplication, status: 'rejected', rejectionReason } } : user
      ));
      setRejectionReason('');
      toast('Host application rejected', 'success');
    } catch (error) {
      console.error('Error rejecting host application:', error);
      toast('Failed to reject host application', 'error');
    }
  };

  const handleRecordPayment = (user: any) => {
    setSelectedUser(user);
    setShowPaymentModal(true);
  };

  const handleOpenHostApplicationModal = (user: any) => {
    setSelectedHostApplication(user);
    setShowHostApplicationModal(true);
  };

  const handlePaymentRecorded = () => {
    const fetchData = async () => {
      try {
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getUserStats()
        ]);
        setUsers(usersData);
        setUserStats(statsData);
      } catch (error) {
        console.error('Error fetching users data:', error);
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = String(error);
        }
        alert('Error fetching users data: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Users' }]} />

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-600 rounded-lg p-6 md:p-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Mobile App Users</h1>
          <p className="text-white/90 text-lg">Manage mobile app users and host applications</p>
        </div>

        {/* Pending Host Applications Alert */}
        {users.filter(user => user.hostApplication?.status === 'pending').length > 0 && (
          <Card className="border-l-4 border-warning-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning-600" />
                <h3 className="text-lg font-semibold text-warning-900">Pending Host Applications ({users.filter(user => user.hostApplication?.status === 'pending').length})</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {users.filter(user => user.hostApplication?.status === 'pending').map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">{user.name || user.email}</p>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p>Applied: {user.hostApplication?.appliedAt?.toLocaleDateString()}</p>
                      <p>Contact: {user.hostApplication?.contactMethod === 'email' 
                        ? user.hostApplication?.contactEmail 
                        : user.hostApplication?.contactPhone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenHostApplicationModal(user)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Review →
                  </button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userStats.totalUsers}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-primary-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userStats.activeUsers}</p>
                </div>
                <div className="p-3 bg-success-100 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Hosts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userStats.pendingHosts}</p>
                </div>
                <div className="p-3 bg-warning-100 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-warning-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Host Application</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={user.role === 'admin' ? 'error' : user.role === 'host' ? 'success' : 'info'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={user.isSuspended ? 'error' : 'success'}>
                            {user.isSuspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.hostApplication ? (
                            <Badge variant={
                              user.hostApplication.status === 'approved' ? 'success' :
                              user.hostApplication.status === 'rejected' ? 'error' :
                              'warning'
                            }>
                              {user.hostApplication.status}
                            </Badge>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex">
                          {!user.isSuspended && (
                            <button
                              onClick={() => handleSuspendUser(user.id, true)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Suspend
                            </button>
                          )}
                          {user.isSuspended && (
                            <button
                              onClick={() => handleSuspendUser(user.id, false)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Reactivate
                            </button>
                          )}
                          {user.hostApplication?.status === 'pending' && (
                            <button
                              onClick={() => handleOpenHostApplicationModal(user)}
                              className="text-primary-600 hover:text-primary-900 font-medium"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modals */}
      {showPaymentModal && selectedUser && (
        <PaymentModal user={selectedUser} onClose={() => { setShowPaymentModal(false); handlePaymentRecorded(); }} />
      )}

      {showHostApplicationModal && selectedHostApplication && (
        <HostApplicationModal 
          user={selectedHostApplication}
          onClose={() => setShowHostApplicationModal(false)}
          onApprove={() => handleApproveHost(selectedHostApplication.id)}
          onReject={(reason) => handleRejectHost(selectedHostApplication.id)}
        />
      )}
    </AdminLayout>
  );
}
