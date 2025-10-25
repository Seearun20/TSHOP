

import { z } from 'zod';

// Mock data for StitchSavvy

export const financialSummary = {
  totalSales: 45231.89,
  totalPurchases: 21789.45,
  totalProfit: 23442.44,
  newOrders: 32,
};

export const salesChartData = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 4500 },
  { month: "May", sales: 6000 },
  { month: "Jun", sales: 5500 },
  { month: "Jul", sales: 7000 },
  { month: "Aug", sales: 6500 },
  { month: "Sep", sales: 7200 },
  { month: "Oct", sales: 8000 },
  { month: "Nov", sales: 7500 },
  { month: "Dec", sales: 9000 },
];

export const recentOrders = [
  {
    id: "ORD001",
    customerName: "Liam Johnson",
    customerEmail: "liam@example.com",
    amount: 250.0,
    status: "Paid",
  },
  {
    id: "ORD002",
    customerName: "Olivia Smith",
    customerEmail: "olivia@example.com",
    amount: 150.75,
    status: "Pending",
  },
  {
    id: "ORD003",
    customerName: "Noah Williams",
    customerEmail: "noah@example.com",
    amount: 350.5,
    status: "Paid",
  },
  {
    id: "ORD004",
    customerName: "Emma Brown",
    customerEmail: "emma@example.com",
    amount: 450.0,
    status: "Balance",
  },
  {
    id: "ORD005",
    customerName: "Ava Jones",
    customerEmail: "ava@example.com",
    amount: 550.0,
    status: "Paid",
  },
];

export const serviceCharges = {
    'Shirt': 500,
    'Pant': 600,
    'Kurta+Pyjama': 900,
    'Kurta': 500,
    'Pyjama': 400,
    '3pc Suit': 5000,
    '2pc Suit': 3500,
    'Blazer': 2500,
    'Sherwani': 7000,
    'Basket': 1500,
};

// Base Measurement Schemas
export const pantMeasurements = z.object({ 
    length: z.string().optional(), 
    waist: z.string().optional(), 
    hip: z.string().optional(), 
    thigh: z.string().optional(),
    bottom: z.string().optional(),
    latak: z.string().optional(),
    mori: z.string().optional(),
});
export const shirtMeasurements = z.object({ 
    length: z.string().optional(), 
    shoulder: z.string().optional(),
    sleeve: z.string().optional(),
    chest: z.string().optional(), 
    waist: z.string().optional(), 
    hip: z.string().optional(),
    collar: z.string().optional(),
});

export const blazerMeasurements = z.object({
    coatLength: z.string().optional(),
    coatShoulder: z.string().optional(),
    coatSleeve: z.string().optional(),
    coatChest: z.string().optional(),
    coatWaist: z.string().optional(),
    coatHips: z.string().optional(),
    coatCollar: z.string().optional(),
});

export const basketMeasurements = z.object({
    basketLength: z.string().optional(),
    basketShoulder: z.string().optional(),
    basketChest: z.string().optional(),
    basketWaist: z.string().optional(),
    basketHip: z.string().optional(),
    basketCollar: z.string().optional(),
});

export const pyjamaMeasurements = z.object({
    length: z.string().optional(),
    waist: z.string().optional(),
    hip: z.string().optional(),
    mori: z.string().optional(),
    latak: z.string().optional(),
    bottom: z.string().optional(),
});

// Composite Schemas for Apparel
export const twoPieceSuitMeasurements = z.object({ ...pantMeasurements.shape, ...blazerMeasurements.shape });
export const threePieceSuitMeasurements = z.object({ ...pantMeasurements.shape, ...blazerMeasurements.shape, basketLength: z.string().optional() });
export const sherwaniMeasurements = twoPieceSuitMeasurements;
export const kurtaPyjamaMeasurements = z.object({ ...shirtMeasurements.shape, ...pantMeasurements.shape });


// Master Apparel Measurement Definition
export const apparelMeasurements: Record<string, z.ZodObject<any>> = {
  'Pant': pantMeasurements,
  'Shirt': shirtMeasurements,
  'Kurta Pyjama': kurtaPyjamaMeasurements,
  '2pc Suit': twoPieceSuitMeasurements,
  '3pc Suit': threePieceSuitMeasurements,
  'Sherwani': sherwaniMeasurements,
  'Blazer': blazerMeasurements, // Also referred to as 'Coat'
  'Basket': basketMeasurements,
};
