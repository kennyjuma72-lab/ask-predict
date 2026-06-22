import React, { useEffect } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { CreditCard, Calendar, Users, Settings } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Card, CardHeader, CardBody, Breadcrumb } from '../components';
import { DashboardStats } from '../components/DashboardStats';
import { RecentActivity } from '../components/RecentActivity';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const quickActions = [
    {
      icon: CreditCard,
      title: 'Payment Management',
      description: 'Track and manage manual payments',
      href: '/payments',
      gradient: 'from-secondary-50 to-secondary-100',
      borderColor: 'border-secondary-200',
      accentGradient: 'from-secondary-500 to-secondary-600',
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Approve and manage events',
      href: '/events',
      gradient: 'from-primary-50 to-primary-100',
      borderColor: 'border-primary-200',
      accentGradient: 'from-primary-500 to-primary-600',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Approve hosts and manage users',
      href: '/users',
      gradient: 'from-accent-50 to-accent-100',
      borderColor: 'border-accent-200',
      accentGradient: 'from-accent-500 to-accent-600',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure platform settings',
      href: '/settings',
      gradient: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-200',
      accentGradient: 'from-gray-500 to-gray-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Dashboard' }]} />

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-600 rounded-lg p-6 md:p-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user.name}</h1>
          <p className="text-white/90 text-lg">Empowering women through events management</p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600 mt-1">Common tasks</p>
              </CardHeader>
              <CardBody className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border-l-4 hover:shadow-md ${action.gradient} ${action.borderColor} group`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${action.accentGradient}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{action.title}</p>
                        <p className="text-xs text-gray-600 truncate">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add server-side authentication check here
  return {
    props: {},
  };
};
