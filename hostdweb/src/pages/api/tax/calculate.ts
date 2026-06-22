/**
 * Tax API - Calculate Tax
 * POST /api/tax/calculate
 * 
 * Step 3.2: Calculate tax for a transaction
 * Uses Stripe Tax API for accuracy (recommended) or local tax rates
 * 
 * Note: For production, integrate Stripe Tax API:
 * https://stripe.com/docs/tax
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { TaxCalculationRequest, TaxCalculationResult, TaxRate } from '@/types/tax';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TaxCalculationResult | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, country, state, city, zipCode }: TaxCalculationRequest = req.body;

        if (!amount || !country) {
            return res.status(400).json({ error: 'Amount and country are required' });
        }

        // Option 1: Use Stripe Tax API (Recommended for production)
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const calculation = await stripe.tax.calculations.create({
        //   currency: 'usd',
        //   line_items: [{
        //     amount: amount * 100,
        //     reference: 'ticket',
        //   }],
        //   customer_details: {
        //     address: { country, state, city, postal_code: zipCode },
        //   },
        // });
        // return res.json(parseStripeTax(calculation));

        // Option 2: Use local tax rates (current implementation)
        const taxRates = await fetchApplicableTaxRates(country, state, city);

        if (taxRates.length === 0) {
            // No tax for this location
            return res.json({
                subtotal: amount,
                taxAmount: 0,
                total: amount,
                breakdown: [],
                appliedRates: []
            });
        }

        // Calculate tax
        let totalTaxRate = 0;
        const breakdown = taxRates.map(rate => {
            totalTaxRate += rate.rate;
            const taxAmount = amount * rate.rate;

            return {
                jurisdiction: rate.name,
                rate: rate.rate,
                amount: Math.round(taxAmount * 100) / 100,
                type: rate.type
            };
        });

        const taxAmount = Math.round(amount * totalTaxRate * 100) / 100;
        const total = Math.round((amount + taxAmount) * 100) / 100;

        return res.json({
            subtotal: amount,
            taxAmount,
            total,
            breakdown,
            appliedRates: taxRates
        });

    } catch (error: any) {
        console.error('Error calculating tax:', error);
        return res.status(500).json({ error: error.message || 'Failed to calculate tax' });
    }
}

/**
 * Fetch applicable tax rates from Firestore
 */
async function fetchApplicableTaxRates(
    country: string,
    state?: string,
    city?: string
): Promise<TaxRate[]> {
    const taxRates: TaxRate[] = [];

    // Query country-level tax
    let q = query(
        collection(db, 'taxRates'),
        where('country', '==', country),
        where('isActive', '==', true)
    );

    if (state) {
        // Query state-level tax
        q = query(
            collection(db, 'taxRates'),
            where('country', '==', country),
            where('state', '==', state),
            where('isActive', '==', true)
        );
    }

    const snapshot = await getDocs(q);

    snapshot.docs.forEach(doc => {
        const rate = { id: doc.id, ...doc.data() } as TaxRate;

        // Check validity period
        const now = new Date();
        const validFrom = rate.validFrom.toDate();
        const validUntil = rate.validUntil?.toDate();

        if (validFrom <= now && (!validUntil || validUntil >= now)) {
            taxRates.push(rate);
        }
    });

    return taxRates;
}
