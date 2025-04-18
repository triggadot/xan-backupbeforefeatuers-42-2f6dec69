// src/components/shipping/ShippingDashboard.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchShippingRecords } from "@/services/ShippingServices";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
}

const StatCard = ({ title, value, description }: StatCardProps) => (
  <Card className="w-full shadow-sm">
    <CardHeader>
      <CardTitle className="text-base md:text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
    </CardContent>
  </Card>
);

export default function ShippingDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    boxSize: "all",
    state: "all",
    dateRange: "last6Months",
  });
  const [boxSizes, setBoxSizes] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        // 1. Fetch all shipping records with filters
        const records = await glShippingRecordsService.getShippingRecords({
          ...(filters.boxSize !== "all" ? { boxSizes: filters.boxSize } : {}),
          ...(filters.state !== "all" ? { receiverState: filters.state } : {}),
          // Add dateFrom/dateTo if you implement date filtering
        });

        // 2. Compute stats
        const totalShipments = records.length;
        const avgWeight =
          records.length > 0
            ? (
                records.reduce((sum, r) => sum + (r.box_weight || 0), 0) /
                records.length
              ).toFixed(2)
            : 0;

        // 3. Most common box size
        const boxSizeCounts: Record<string, number> = {};
        records.forEach((r) => {
          if (r.box_sizes)
            boxSizeCounts[r.box_sizes] = (boxSizeCounts[r.box_sizes] || 0) + 1;
        });
        const mostCommonBox =
          Object.entries(boxSizeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "N/A";

        // 4. Box size distribution
        const boxSizeDistribution = Object.entries(boxSizeCounts).map(
          ([box, count]) => ({ box, count })
        );

        // 5. State distribution
        const stateCounts: Record<string, number> = {};
        records.forEach((r) => {
          if (r.receiver_state)
            stateCounts[r.receiver_state] =
              (stateCounts[r.receiver_state] || 0) + 1;
        });
        const stateDistribution = Object.entries(stateCounts).map(
          ([state, count]) => ({ state, count })
        );

        // 6. Box sizes (for filter dropdown)
        const allBoxSizes = Array.from(
          new Set(records.map((r) => r.box_sizes).filter(Boolean))
        );
        setBoxSizes(["all", ...allBoxSizes]);

        setStats({
          totalShipments,
          avgWeight,
          mostCommonBox,
          boxSizeDistribution,
          stateDistribution,
        });
      } catch (error) {
        setStats(null);
        setBoxSizes(["all"]);
        // Optionally show error toast
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  // Responsive grid: 1 col mobile, 2-4 cols desktop
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 w-full flex flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="box-sizes">Box Sizes</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
        </TabsList>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Select
            value={filters.boxSize}
            onValueChange={(v) => setFilters((f) => ({ ...f, boxSize: v }))}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Box Size" />
            </SelectTrigger>
            <SelectContent>
              {boxSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.state}
            onValueChange={(v) => setFilters((f) => ({ ...f, state: v }))}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="CA">CA</SelectItem>
              <SelectItem value="NY">NY</SelectItem>
              <SelectItem value="TX">TX</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {/* Date range picker could go here */}
        </div>
        <TabsContent value="overview">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard title="Total Shipments" value={stats.totalShipments} />
              <StatCard title="Avg. Weight (kg)" value={stats.avgWeight} />
              <StatCard title="Most Common Box" value={stats.mostCommonBox} />
            </div>
          )}
        </TabsContent>
        <TabsContent value="box-sizes">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Bar
              data={{
                labels: stats.boxSizeDistribution.map((b: any) => b.box),
                datasets: [
                  {
                    label: "Shipments",
                    data: stats.boxSizeDistribution.map((b: any) => b.count),
                    backgroundColor: ["#fbbf24", "#60a5fa", "#34d399"],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true },
                },
              }}
            />
          )}
        </TabsContent>
        <TabsContent value="states">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Pie
              data={{
                labels: stats.stateDistribution.map((s: any) => s.state),
                datasets: [
                  {
                    label: "Shipments",
                    data: stats.stateDistribution.map((s: any) => s.count),
                    backgroundColor: [
                      "#fbbf24",
                      "#60a5fa",
                      "#34d399",
                      "#818cf8",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
