
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


export const readyMadeStock = [
  { id: "RM001", item: "Sherwani", size: "40", cost: 5000, supplier: "Gupta Textiles", quantity: 5 },
  { id: "RM002", item: "3pc Suit", size: "42", cost: 7000, supplier: "Royal Suits", quantity: 3 },
  { id: "RM003", item: "2pc Suit", size: "38", cost: 4500, supplier: "Royal Suits", quantity: 7 },
  { id: "RM004", item: "Blazer", size: "M", cost: 3000, supplier: "Modern Attire", quantity: 10 },
];

export const fabricStock = [
  { id: "FAB001", type: "Italian Wool", length: 50, costPerMtr: 1200, supplier: "Fabric Mart" },
  { id: "FAB002", type: "Egyptian Cotton", length: 100, costPerMtr: 800, supplier: "Cotton Kings" },
  { id: "FAB003", type: "Linen", length: 75, costPerMtr: 950, supplier: "Fabric Mart" },
  { id: "FAB004", type: "Silk", length: 30, costPerMtr: 2500, supplier: "Silk Route" },
];

export interface Order {
    id: string;
    customerName: string;
    deliveryDate: string;
    total: number;
    paid: number;
    balance: number;
    status: string;
    items: string;
    measurements?: {
        [key: string]: string | undefined;
    };
}


export const orders: Order[] = [
  { 
    id: "ORD101", 
    customerName: "Arjun Sharma", 
    deliveryDate: "2024-08-15", 
    total: 3500, 
    paid: 3500, 
    balance: 0, 
    status: "Delivered",
    items: "Kurta Pyjama Stitching",
    measurements: {
        length: '42',
        chest: '44',
        sleeve: '25',
        shoulder: '18',
    }
  },
  { 
    id: "ORD102", 
    customerName: "Priya Singh", 
    deliveryDate: "2024-08-20", 
    total: 8500, 
    paid: 5000, 
    balance: 3500, 
    status: "In Progress",
    items: "3pc Suit (Fabric + Stitching)"
  },
  { 
    id: "ORD103", 
    customerName: "Rohan Verma", 
    deliveryDate: "2024-08-18", 
    total: 1200, 
    paid: 1200, 
    balance: 0, 
    status: "Ready",
    items: "Shirt Stitching"
  },
];

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    measurements: string;
}

export const customers: Customer[] = [
    { id: "CUST001", name: "Arjun Sharma", phone: "9876543210", email: "arjun.s@example.com", measurements: "Shirt: L-28, C-42, SL-25" },
    { id: "CUST002", name: "Priya Singh", phone: "9876543211", email: "priya.s@example.com", measurements: "Suit: L-30, C-40, W-34" },
    { id: "CUST003", name: "Rohan Verma", phone: "9876543212", email: "rohan.v@example.com", measurements: "Shirt: L-29, C-44, SL-26" },
];

export interface Employee {
    id: string;
    name: string;
    role: string;
    salary: number;
    balance: number;
    leaves: number;
}

export const employees: Employee[] = [
    { id: "EMP001", name: "Suresh Kumar", role: "Master Tailor", salary: 25000, balance: 0, leaves: 2 },
    { id: "EMP002", name: "Ramesh Jain", role: "Assistant Tailor", salary: 18000, balance: 500, leaves: 1 },
    { id: "EMP003", name: "Vikas Mehra", role: "Salesman", salary: 15000, balance: 0, leaves: 4 },
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
    'Sherwani': 7000
};
