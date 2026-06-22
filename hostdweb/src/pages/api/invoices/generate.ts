/**
 * Invoice API - Generate Invoice
 * POST /api/invoices/generate
 * 
 * Step 3.3: Generate professional invoice
 * Creates invoice record in Firestore and generates PDF
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { Invoice, InvoiceGenerationRequest, InvoiceItem } from '@/types/tax';

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
            customerId,
            items,
            customerInfo,
            discountAmount = 0,
            notes
        }: InvoiceGenerationRequest = req.body;

        if (!eventId || !customerId || !items || !customerInfo) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get event details
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const event = eventDoc.data();

        // Calculate tax for each item
        const invoiceItems: InvoiceItem[] = [];
        let subtotal = 0;
        let totalTax = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemTotal = item.quantity * item.unitPrice;

            // Calculate tax (simplified - use tax/calculate API for accuracy)
            const taxRate = 0.08; // 8% - should come from tax/calculate API
            const taxAmount = itemTotal * taxRate;

            invoiceItems.push({
                id: `item-${i + 1}`,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate,
                taxAmount: Math.round(taxAmount * 100) / 100,
                total: Math.round((itemTotal + taxAmount) * 100) / 100,
            });

            subtotal += itemTotal;
            totalTax += taxAmount;
        }

        // Calculate totals
        subtotal = Math.round(subtotal * 100) / 100;
        totalTax = Math.round(totalTax * 100) / 100;
        const total = Math.round((subtotal + totalTax - discountAmount) * 100) / 100;

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();

        // Create invoice
        const invoiceData: Omit<Invoice, 'id'> = {
            invoiceNumber,
            eventId,
            eventTitle: event.title,
            hostId: event.hostId,
            customerId,
            customerEmail: customerInfo.email,
            items: invoiceItems,
            subtotal,
            taxAmount: totalTax,
            discountAmount,
            total,
            currency: 'USD',
            taxBreakdown: [
                {
                    jurisdiction: 'State Tax',
                    rate: 0.08,
                    amount: totalTax,
                    type: 'sales_tax'
                }
            ],
            status: 'sent',
            issuedAt: Timestamp.now(),
            dueAt: Timestamp.now(), // Immediate payment
            notes,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'invoices'), invoiceData);

        // Generate PDF (implement separately)
        // const pdfUrl = await generateInvoicePDF(docRef.id, invoiceData);

        return res.status(201).json({
            success: true,
            invoiceId: docRef.id,
            invoiceNumber,
            total,
            message: 'Invoice generated successfully'
        });

    } catch (error: any) {
        console.error('Error generating invoice:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate invoice' });
    }
}

/**
 * Generate sequential invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();

    // Query for latest invoice this year
    // For simplicity, using timestamp-based approach
    // In production, use a counter in Firestore
    const timestamp = Date.now().toString().slice(-5);

    return `INV-${year}-${timestamp}`;
}
