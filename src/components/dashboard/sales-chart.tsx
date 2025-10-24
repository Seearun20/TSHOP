
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface SalesChartProps {
    data: { month: string; sales: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Sales Overview</CardTitle>
            <CardDescription>A summary of your monthly sales.</CardDescription>
        </CardHeader>
      <CardContent>
        <div className="h-[300px]">
        <ChartContainer config={{
            sales: {
              label: "Sales",
              color: "hsl(var(--primary))",
            },
          }} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}K`} />
                <ChartTooltip 
                    cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                    content={<ChartTooltipContent />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
