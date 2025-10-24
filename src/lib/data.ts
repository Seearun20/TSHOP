

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

    