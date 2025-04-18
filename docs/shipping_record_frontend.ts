// Client Component
const Component = () => {
  const [loading, setLoading] = useState(true);
  const [shippingStats, setShippingStats] = useState(null);
  const [boxSizeDistribution, setBoxSizeDistribution] = useState([]);
  const [monthlyShipments, setMonthlyShipments] = useState([]);
  const [topDropOffLocations, setTopDropOffLocations] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);
  const [statePieData, setStatePieData] = useState({
    labels: [],
    datasets: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [boxSizeFilter, setBoxSizeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("last6Months");
  const [selectedState, setSelectedState] = useState("all");
  const [boxSizes, setBoxSizes] = useState([]); // Added this state to hold box sizes

  const colorPalette = [
    '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12',
    '#1abc9c', '#34495e', '#d35400', '#c0392b', '#16a085'
  ];

  useEffect(() => {
    fetchData();
  }, [boxSizeFilter, dateRange, selectedState]);

  // New effect to fetch box sizes separately once
  useEffect(() => {
    async function fetchBoxSizes() {
      try {
        const sizes = await runServerFunction('getAllBoxSizes', {});
        if (Array.isArray(sizes)) {
          setBoxSizes(sizes);
        } else {
          console.error('Box sizes response is not an array:', sizes);
          setBoxSizes([]);
        }
      } catch (error) {
        console.error('Error fetching box sizes:', error);
        setBoxSizes([]);
      }
    }

    fetchBoxSizes();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const statsResult = await runServerFunction('getShippingStats', {
        boxSizeFilter,
        dateRange,
        selectedState
      });
      setShippingStats(statsResult);

      const boxSizesResult = await runServerFunction('getBoxSizeDistribution', {
        dateRange,
        selectedState
      });
      setBoxSizeDistribution(Array.isArray(boxSizesResult) ? boxSizesResult : []);

      const monthlyResult = await runServerFunction('getMonthlyShipmentTrends', {
        boxSizeFilter,
        dateRange,
        selectedState
      });
      setMonthlyShipments(Array.isArray(monthlyResult) ? monthlyResult : []);

      const locationsResult = await runServerFunction('getTopDropOffLocations', {
        boxSizeFilter,
        dateRange,
        selectedState
      });
      setTopDropOffLocations(Array.isArray(locationsResult) ? locationsResult : []);

      const stateData = await runServerFunction('getStateDistribution', {
        boxSizeFilter,
        dateRange
      });

      if (Array.isArray(stateData)) {
        setStatePieData({
          labels: stateData.map(item => item.state || 'Unknown'),
          datasets: [
            {
              data: stateData.map(item => item.count),
              backgroundColor: colorPalette.slice(0, stateData.length),
              borderWidth: 1,
            }
          ]
        });
      }

      const recentData = await runServerFunction('getRecentShipments', {
        limit: 10,
        boxSizeFilter,
        selectedState
      });
      setRecentShipments(Array.isArray(recentData) ? recentData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSkeleton = () => (
    <div className= "space-y-4 w-full" >
    <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" >
        <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
              </div>
              < Skeleton className = "h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                  </div>
  );

const StatCard = ({ title, value, icon, description }) => {
  const Icon = LucideReact[icon] || LucideReact.Package;
  return (
    <Card className= "h-full" >
    <CardHeader className="pb-2 flex flex-row items-center justify-between" >
      <CardTitle className="text-sm font-medium" > { title } </CardTitle>
        < Icon className = "h-4 w-4 text-muted-foreground" />
          </CardHeader>
          < CardContent >
          <div className="text-2xl font-bold" > { value } </div>
            < p className = "text-xs text-muted-foreground" > { description } </p>
              </CardContent>
              </Card>
    );
  };

const renderBoxSizeBarChart = () => {
  if (!boxSizeDistribution || boxSizeDistribution.length === 0) return <div>No box size data available </div>;

  const chartData = {
    labels: boxSizeDistribution.map(item => item.box_sizes || 'Unknown'),
    datasets: [
      {
        label: 'Number of Packages',
        data: boxSizeDistribution.map(item => item.count),
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Box Size Distribution',
      },
    },
  };

  return <Bar data={ chartData } options = { options } />;
};

const renderMonthlyTrendChart = () => {
  if (!monthlyShipments || monthlyShipments.length === 0) return <div>No monthly trend data available </div>;

  const chartData = {
    labels: monthlyShipments.map(item => item.month),
    datasets: [
      {
        label: 'Number of Shipments',
        data: monthlyShipments.map(item => parseInt(item.count) || 0),
        fill: false,
        backgroundColor: '#2ecc71',
        borderColor: '#27ae60',
        tension: 0.3,
      },
      {
        label: 'Average Weight',
        data: monthlyShipments.map(item => parseFloat(item.avg_weight) || 0),
        fill: false,
        backgroundColor: '#e74c3c',
        borderColor: '#c0392b',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Monthly Shipment Trends',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Shipments'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Average Weight'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Line data={ chartData } options = { options } />;
};

const renderTopLocationsChart = () => {
  if (!topDropOffLocations || topDropOffLocations.length === 0) return <div>No drop - off location data available </div>;

  const chartData = {
    labels: topDropOffLocations.map(item => item.drop_off_location_uid || 'Unknown'),
    datasets: [
      {
        label: 'Number of Packages',
        data: topDropOffLocations.map(item => item.count),
        backgroundColor: colorPalette.slice(0, topDropOffLocations.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Top Drop-off Locations',
      },
    },
  };

  return <Doughnut data={ chartData } options = { options } />;
};

const renderStateDistribution = () => {
  if (!statePieData.labels.length) return <div>No state distribution data available </div>;

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Shipments by State',
      },
    },
  };

  return <Pie data={ statePieData } options = { options } />;
};

const renderFilters = () => (
  <div className= "flex flex-col md:flex-row gap-4 mb-6" >
  <div className="flex-1" >
    <Label htmlFor="dateRange" > Date Range </Label>
      < Select
value = { dateRange }
onValueChange = { setDateRange }
  >
  <SelectTrigger id="dateRange" >
    <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      < SelectContent >
      <SelectItem value="last30Days" > Last 30 Days </SelectItem>
        < SelectItem value = "last3Months" > Last 3 Months </SelectItem>
          < SelectItem value = "last6Months" > Last 6 Months </SelectItem>
            < SelectItem value = "lastYear" > Last Year </SelectItem>
              < SelectItem value = "allTime" > All Time </SelectItem>
                </SelectContent>
                </Select>
                </div>

                < div className = "flex-1" >
                  <Label htmlFor="boxSize" > Box Size </Label>
                    < Select
value = { boxSizeFilter }
onValueChange = { setBoxSizeFilter }
  >
  <SelectTrigger id="boxSize" >
    <SelectValue placeholder="Filter by box size" />
      </SelectTrigger>
      < SelectContent >
      <SelectItem value="all" > All Sizes </SelectItem>
{
  Array.isArray(boxSizes) && boxSizes.map((size, index) => (
    <SelectItem key= { index } value = { size || 'unknown'}>
      { size || 'Unknown'}
</SelectItem>
            ))}
</SelectContent>
  </Select>
  </div>

  < div className = "flex-1" >
    <Label htmlFor="state" > Receiver State </Label>
      < Select
value = { selectedState }
onValueChange = { setSelectedState }
  >
  <SelectTrigger id="state" >
    <SelectValue placeholder="Filter by state" />
      </SelectTrigger>
      < SelectContent >
      <SelectItem value="all" > All States </SelectItem>
{
  statePieData.labels && statePieData.labels.map((state, index) => (
    <SelectItem key= { index } value = { state } >
    { state }
    </SelectItem>
  ))
}
</SelectContent>
  </Select>
  </div>
  </div>
  );

const renderRecentShipmentsTable = () => (
  <div className= "rounded-md border" >
  <Table>
  <TableHeader>
  <TableRow>
  <TableHead>Tracking Number</TableHead>
    < TableHead > Recipient </TableHead>
    < TableHead > State </TableHead>
    < TableHead > Ship Date </TableHead>
      < TableHead > Box Size </TableHead>
        < TableHead > Weight </TableHead>
        </TableRow>
        </TableHeader>
        <TableBody>
{
  recentShipments.length > 0 ? (
    recentShipments.map((shipment) => (
      <TableRow key= { shipment.id } >
      <TableCell className="font-medium" > { shipment.tracking_number || 'N/A' } </TableCell>
      < TableCell > { shipment.receiver_name || 'N/A' } </TableCell>
      < TableCell > { shipment.receiver_state || 'N/A' } </TableCell>
      < TableCell > { shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : 'N/A' } </TableCell>
      < TableCell > { shipment.box_sizes || 'N/A' } </TableCell>
      < TableCell > { shipment.box_weight || 'N/A' } </TableCell>
    </TableRow>
    ))
          ) : (
    <TableRow>
    <TableCell colSpan= { 6} className = "text-center py-4" > No shipments found </TableCell>
      </TableRow>
          )
}
</TableBody>
  </Table>
  </div>
  );

return (
  <div className= "container mx-auto py-6 space-y-8" >
  <div className="flex justify-between items-center" >
    <h1 className="text-3xl font-bold tracking-tight" > Shipping Analytics Dashboard </h1>
      < TooltipProvider >
      <Tooltip>
      <TooltipTrigger asChild >
      <Button
                variant="outline"
size = "icon"
onClick = { fetchData }
  >
  <LucideReact.RefreshCw className="h-4 w-4" />
    </Button>
    </TooltipTrigger>
    < TooltipContent >
    <p>Refresh Data </p>
      </TooltipContent>
      </Tooltip>
      </TooltipProvider>
      </div>

      < Tabs defaultValue = "overview" value = { activeTab } onValueChange = { setActiveTab } >
        <TabsList className="grid grid-cols-4 mb-6" >
          <TabsTrigger value="overview" > Overview </TabsTrigger>
            < TabsTrigger value = "trends" > Trends </TabsTrigger>
              < TabsTrigger value = "distributions" > Distributions </TabsTrigger>
                < TabsTrigger value = "shipments" > Recent Shipments </TabsTrigger>
                  </TabsList>

{
  loading ? renderSkeleton() : (
    <>
    { renderFilters() }

    < TabsContent value = "overview" className = "space-y-6" >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" >
        <StatCard
                  title="Total Shipments"
  value = { shippingStats?.totalShipments || 0
}
icon = "PackageCheck"
description = "Total packages shipped"
  />
  <StatCard
                  title="Avg. Package Weight"
value = {`${shippingStats?.avgWeight?.toFixed(2) || 0} lbs`}
icon = "Scale"
description = "Average package weight"
  />
  <StatCard
                  title="Most Common Box Size"
value = { shippingStats?.mostCommonBoxSize || 'N/A'}
icon = "Box"
description = {`Used in ${shippingStats?.mostCommonBoxCount || 0} shipments`}
                />
  < StatCard
title = "Most Active State"
value = { shippingStats?.mostActiveState || 'N/A'}
icon = "MapPin"
description = {`${shippingStats?.mostActiveStateCount || 0} shipments`}
                />
  </div>

  < div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
    <Card>
    <CardHeader>
    <CardTitle>Monthly Shipping Trends </CardTitle>
      </CardHeader>
      < CardContent className = "pt-2 h-[350px]" >
        { renderMonthlyTrendChart() }
        </CardContent>
        </Card>
        < Card >
        <CardHeader>
        <CardTitle>Top Drop - off Locations </CardTitle>
          </CardHeader>
          < CardContent className = "pt-2 h-[350px]" >
            { renderTopLocationsChart() }
            </CardContent>
            </Card>
            </div>
            </TabsContent>

            < TabsContent value = "trends" className = "space-y-6" >
              <Card>
              <CardHeader>
              <CardTitle>Monthly Shipping Volume and Weight Trends </CardTitle>
                <CardDescription>
                    Tracking package counts and average weights over time
  </CardDescription>
  </CardHeader>
  < CardContent className = "h-[400px]" >
    { renderMonthlyTrendChart() }
    </CardContent>
    </Card>

    < div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
      <StatCard
                  title="Growth Rate"
value = {`${shippingStats?.growthRate?.toFixed(2) || 0}%`}
icon = "TrendingUp"
description = "Growth compared to previous period"
  />
  <StatCard
                  title="Busiest Month"
value = { shippingStats?.busiestMonth || 'N/A'}
icon = "Calendar"
description = {`${shippingStats?.busiestMonthCount || 0} shipments`}
                />
  </div>
  </TabsContent>

  < TabsContent value = "distributions" className = "space-y-6" >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
      <Card>
      <CardHeader>
      <CardTitle>Box Size Distribution </CardTitle>
        </CardHeader>
        < CardContent className = "pt-2 h-[350px]" >
          { renderBoxSizeBarChart() }
          </CardContent>
          </Card>
          < Card >
          <CardHeader>
          <CardTitle>Shipments by State </CardTitle>
            </CardHeader>
            < CardContent className = "pt-2 h-[350px]" >
              { renderStateDistribution() }
              </CardContent>
              </Card>
              </div>
              </TabsContent>

              < TabsContent value = "shipments" >
                <Card>
                <CardHeader>
                <CardTitle>Recent Shipments </CardTitle>
                  <CardDescription>
                    Latest { recentShipments.length } shipments in the system
  </CardDescription>
  </CardHeader>
  <CardContent>
{ renderRecentShipmentsTable() }
</CardContent>
  </Card>
  </TabsContent>
  </>
        )}
</Tabs>
  </div>
  );
};
