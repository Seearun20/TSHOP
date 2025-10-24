
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, UserPlus } from "lucide-react";

interface FinancialCardsProps {
  summary: {
    totalSales: number;
    totalPurchases: number;
    totalProfit: number;
    newOrders: number;
  };
}

export function FinancialCards({ summary }: FinancialCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalSales)}
          </div>
          <p className="text-xs text-muted-foreground">All-time sales revenue</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalPurchases)}
          </div>
          <p className="text-xs text-muted-foreground">All-time inventory cost</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalProfit)}
          </div>
          <p className="text-xs text-muted-foreground">Gross profit (Sales - Purchases)</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Orders</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{summary.newOrders}</div>
          <p className="text-xs text-muted-foreground">this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
