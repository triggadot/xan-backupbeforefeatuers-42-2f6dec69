// Client Component
const Component = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [dashboardData, setDashboardData] = useState(null);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Calendar,
    DollarSign,
    FileText,
    TrendingUp,
    Truck,
    Users
  } = LucideReact;

  useEffect(() => {
    loadDashboardData();
  }, [period, useCustomDates, dateFrom, dateTo]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await runServerFunction('getDashboardKPIs', {
        selectedPeriod: period,
        dateFrom,
        dateTo,
        useCustomDates
      });
      setDashboardData(data);
    } catch (error) {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const renderChangeIndicator = (changePercent) => {
    if (!changePercent && changePercent !== 0) return null;

    const isPositive = changePercent >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? ArrowUp : ArrowDown;

    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(changePercent).toFixed(1)}%</span>
      </div>
    );
  };

  const renderKPICard = (title, value, change, icon, description, formatter = (v) => v) => {
    const Icon = icon;
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter(value)}</div>
          <div className="flex items-center justify-between mt-1">
            {renderChangeIndicator(change)}
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between">
        <h1 className="text-2xl font-bold">Business Dashboard</h1>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center">
            <Tabs value={period} onValueChange={setPeriod} className="w-full">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="quarter">Quarter</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="custom-dates"
              checked={useCustomDates}
              onCheckedChange={setUseCustomDates}
            />
            <Label htmlFor="custom-dates">Custom Range</Label>
          </div>

          {useCustomDates && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <span className="hidden sm:inline">-</span>
              <div className="flex items-center">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[150px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardData ? (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {renderKPICard(
              "Revenue",
              dashboardData.revenue.value,
              dashboardData.revenue.change,
              DollarSign,
              "vs previous period",
              formatCurrency
            )}

            {renderKPICard(
              "Total Invoices",
              dashboardData.invoiceCount.value,
              dashboardData.invoiceCount.change,
              FileText,
              "vs previous period"
            )}

            {renderKPICard(
              "Active Clients",
              dashboardData.activeClientCount.value,
              dashboardData.activeClientCount.change,
              Users,
              "vs previous period"
            )}

            {renderKPICard(
              "Average Invoice",
              dashboardData.averageInvoice.value,
              dashboardData.averageInvoice.change,
              TrendingUp,
              "vs previous period",
              formatCurrency
            )}

            {renderKPICard(
              "Expenses",
              dashboardData.expenses.value,
              dashboardData.expenses.change,
              Truck,
              "vs previous period",
              formatCurrency
            )}

            {renderKPICard(
              "Profit",
              dashboardData.profit.value,
              dashboardData.profit.change,
              DollarSign,
              "vs previous period",
              formatCurrency
            )}

            {renderKPICard(
              "Profit Margin",
              dashboardData.profitMargin.value,
              dashboardData.profitMargin.change,
              TrendingUp,
              "vs previous period",
              (val) => `${val.toFixed(1)}%`
            )}

            {renderKPICard(
              "Payment Rate",
              dashboardData.paymentRate.value,
              dashboardData.paymentRate.change,
              AlertCircle,
              "of invoices paid",
              (val) => `${val.toFixed(1)}%`
            )}
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line
                    data={{
                      labels: dashboardData.revenueChart.labels,
                      datasets: [
                        {
                          label: 'Revenue',
                          data: dashboardData.revenueChart.data,
                          borderColor: 'rgb(99, 102, 241)',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          fill: true,
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(value)
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Client Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Pie
                    data={{
                      labels: dashboardData.revenueByClientType.labels,
                      datasets: [
                        {
                          data: dashboardData.revenueByClientType.data,
                          backgroundColor: [
                            'rgba(99, 102, 241, 0.7)',
                            'rgba(79, 70, 229, 0.7)',
                            'rgba(67, 56, 202, 0.7)'
                          ],
                          borderColor: [
                            'rgba(99, 102, 241, 1)',
                            'rgba(79, 70, 229, 1)',
                            'rgba(67, 56, 202, 1)'
                          ],
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const value = context.raw;
                              const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
};
