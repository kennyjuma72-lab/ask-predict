import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Breadcrumb } from '../../components';

export default function CreateEventPage() {
	return (
		<AdminLayout>
			<div className="p-8">
				<Breadcrumb items={[{ label: 'Create Event' }]} />
				<h1 className="text-2xl font-bold mt-6">Create Event</h1>
				<p className="text-gray-600">This page is a placeholder. Please implement the create-event UI here.</p>
			</div>
		</AdminLayout>
	);
}
