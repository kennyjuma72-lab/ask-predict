import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Card, CardHeader, CardBody, Breadcrumb, Badge, Button } from '../components';
import { useToast } from '../components/Toast';
import { PaymentForm } from '../components/PaymentForm';
import { PaymentList } from '../components/PaymentList';
import { useAuth } from '../hooks/useAuth';
import { getAllPayments, getPaymentStats, subscribeToPaymentStats } from '../services/firestore';
import type { Payment } from '../types';
import { Plus, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const [paymentsData, statsData] = await Promise.all([
          getAllPayments(),
          getPaymentStats()
        ]);
        setPayments(paymentsData);
        setPaymentStats(statsData);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    if (user) {
      loadPayments();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPaymentStats((statsData) => {
      setPaymentStats(statsData);
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handlePaymentAdded = (payment: Payment) => {
    setPayments(prev => [payment, ...prev]);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Payments' }]} />

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-600 rounded-lg p-6 md:p-8 text-white flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment Management</h1>
            <p className="text-white/90 text-lg">Monitor and manage all payment transactions</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30"
          >
            <Plus className="w-5 h-5" />
            New Payment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{paymentStats.totalPayments}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-primary-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{paymentStats.completedPayments}</p>
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
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-warning-600 mt-1">{paymentStats.pendingPayments}</p>
                </div>
                <div className="p-3 bg-warning-100 rounded-lg">
                  <Clock className="w-8 h-8 text-warning-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(paymentStats.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Payment Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Record Manual Payment</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentForm onPaymentAdded={handlePaymentAdded} onCancel={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Payment List */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Payment Transactions</h2>
          </CardHeader>
          <CardBody>
            {loadingPayments ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading payments...</span>
              </div>
            ) : (
              <PaymentList payments={payments} />
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
