async function getShippingStats({ boxSizeFilter, dateRange, selectedState }) {
  let whereClause = '';
  const dateFilter = getDateFilter(dateRange);

  if (dateFilter) {
    whereClause += dateFilter;
  }

  if (boxSizeFilter !== 'all') {
    whereClause += whereClause ? ` AND box_sizes = '${boxSizeFilter}'` : ` WHERE box_sizes = '${boxSizeFilter}'`;
  }

  if (selectedState !== 'all') {
    whereClause += whereClause ? ` AND receiver_state = '${selectedState}'` : ` WHERE receiver_state = '${selectedState}'`;
  }

  // Get total shipments
  const totalQuery = `SELECT COUNT(*) as count FROM gl_shipping_records${whereClause}`;
  const totalResult = await runSQL(totalQuery);
  const totalShipments = totalResult[0]?.count || 0;

  // Get average package weight
  const avgWeightQuery = `
    SELECT AVG(box_weight) as avg_weight
    FROM gl_shipping_records
    ${whereClause}
  `;
  const avgWeightResult = await runSQL(avgWeightQuery);
  const avgWeight = parseFloat(avgWeightResult[0]?.avg_weight || 0);

  // Get most common box size
  const boxSizeQuery = `
    SELECT box_sizes, COUNT(*) as count
    FROM gl_shipping_records
    ${whereClause ? whereClause : ' WHERE box_sizes IS NOT NULL'}
    GROUP BY box_sizes
    ORDER BY count DESC
    LIMIT 1
  `;
  const boxSizeResult = await runSQL(boxSizeQuery);
  const mostCommonBoxSize = boxSizeResult[0]?.box_sizes || 'N/A';
  const mostCommonBoxCount = parseInt(boxSizeResult[0]?.count || 0);

  // Get most active state
  const stateQuery = `
    SELECT receiver_state as state, COUNT(*) as count
    FROM gl_shipping_records
    ${whereClause ? whereClause : ' WHERE receiver_state IS NOT NULL'}
    GROUP BY receiver_state
    ORDER BY count DESC
    LIMIT 1
  `;
  const stateResult = await runSQL(stateQuery);
  const mostActiveState = stateResult[0]?.state || 'N/A';
  const mostActiveStateCount = parseInt(stateResult[0]?.count || 0);

  // Calculate growth rate by comparing current period with previous period
  let growthRate = 0;
  const currentPeriodFilter = dateFilter || '';
  let previousPeriodFilter = '';

  if (dateRange === 'last30Days') {
    previousPeriodFilter = " WHERE ship_date >= NOW() - INTERVAL '60 days' AND ship_date < NOW() - INTERVAL '30 days'";
  } else if (dateRange === 'last3Months') {
    previousPeriodFilter = " WHERE ship_date >= NOW() - INTERVAL '6 months' AND ship_date < NOW() - INTERVAL '3 months'";
  } else if (dateRange === 'last6Months') {
    previousPeriodFilter = " WHERE ship_date >= NOW() - INTERVAL '12 months' AND ship_date < NOW() - INTERVAL '6 months'";
  } else if (dateRange === 'lastYear') {
    previousPeriodFilter = " WHERE ship_date >= NOW() - INTERVAL '2 years' AND ship_date < NOW() - INTERVAL '1 year'";
  }

  if (previousPeriodFilter) {
    let prevWhereClause = previousPeriodFilter;

    if (boxSizeFilter !== 'all') {
      prevWhereClause += ` AND box_sizes = '${boxSizeFilter}'`;
    }

    if (selectedState !== 'all') {
      prevWhereClause += ` AND receiver_state = '${selectedState}'`;
    }

    const previousCountQuery = `SELECT COUNT(*) as count FROM gl_shipping_records${prevWhereClause}`;
    const previousCountResult = await runSQL(previousCountQuery);
    const previousCount = parseInt(previousCountResult[0]?.count || 0);

    if (previousCount > 0) {
      growthRate = ((totalShipments - previousCount) / previousCount) * 100;
    }
  }

  // Find busiest month
  const busiestMonthQuery = `
    SELECT TO_CHAR(ship_date, 'Month YYYY') as month, COUNT(*) as count
    FROM gl_shipping_records
    ${whereClause}
    GROUP BY TO_CHAR(ship_date, 'Month YYYY'), TO_CHAR(ship_date, 'YYYY-MM')
    ORDER BY COUNT(*) DESC, TO_CHAR(ship_date, 'YYYY-MM') DESC
    LIMIT 1
  `;
  const busiestMonthResult = await runSQL(busiestMonthQuery);
  const busiestMonth = busiestMonthResult[0]?.month?.trim() || 'N/A';
  const busiestMonthCount = parseInt(busiestMonthResult[0]?.count || 0);

  return {
    totalShipments: parseInt(totalShipments),
    avgWeight,
    mostCommonBoxSize,
    mostCommonBoxCount,
    mostActiveState,
    mostActiveStateCount,
    growthRate,
    busiestMonth,
    busiestMonthCount
  };
}

async function getAllBoxSizes() {
  const query = `
    SELECT DISTINCT box_sizes
    FROM gl_shipping_records
    WHERE box_sizes IS NOT NULL
    ORDER BY box_sizes
  `;

  const results = await runSQL(query);
  // Extract box_sizes as an array of strings
  return results.map(item => item.box_sizes);
}

async function getBoxSizeDistribution({ dateRange, selectedState }) {
  let whereClause = '';
  const dateFilter = getDateFilter(dateRange);

  if (dateFilter) {
    whereClause += dateFilter;
  }

  if (selectedState !== 'all') {
    whereClause += whereClause ? ` AND receiver_state = '${selectedState}'` : ` WHERE receiver_state = '${selectedState}'`;
  }

  const query = `
    SELECT box_sizes, COUNT(*) as count
    FROM gl_shipping_records
    ${whereClause ? whereClause : ' WHERE box_sizes IS NOT NULL'}
    GROUP BY box_sizes
    ORDER BY count DESC
  `;

  return await runSQL(query);
}

async function getMonthlyShipmentTrends({ boxSizeFilter, dateRange, selectedState }) {
  let whereClause = '';
  const dateFilter = getDateFilter(dateRange);

  if (dateFilter) {
    whereClause += dateFilter;
  }

  if (boxSizeFilter !== 'all') {
    whereClause += whereClause ? ` AND box_sizes = '${boxSizeFilter}'` : ` WHERE box_sizes = '${boxSizeFilter}'`;
  }

  if (selectedState !== 'all') {
    whereClause += whereClause ? ` AND receiver_state = '${selectedState}'` : ` WHERE receiver_state = '${selectedState}'`;
  }

  const query = `
    SELECT
      TO_CHAR(ship_date, 'Mon YYYY') as month,
      COUNT(*) as count,
      AVG(box_weight) as avg_weight
    FROM gl_shipping_records
    ${whereClause}
    GROUP BY TO_CHAR(ship_date, 'Mon YYYY'), TO_CHAR(ship_date, 'YYYY-MM')
    ORDER BY TO_CHAR(ship_date, 'YYYY-MM')
  `;

  return await runSQL(query);
}

async function getTopDropOffLocations({ boxSizeFilter, dateRange, selectedState }) {
  let whereClause = '';
  const dateFilter = getDateFilter(dateRange);

  if (dateFilter) {
    whereClause += dateFilter;
  }

  if (boxSizeFilter !== 'all') {
    whereClause += whereClause ? ` AND box_sizes = '${boxSizeFilter}'` : ` WHERE box_sizes = '${boxSizeFilter}'`;
  }

  if (selectedState !== 'all') {
    whereClause += whereClause ? ` AND receiver_state = '${selectedState}'` : ` WHERE receiver_state = '${selectedState}'`;
  }

  const query = `
    SELECT
      drop_off_location_uid,
      COUNT(*) as count
    FROM gl_shipping_records
    ${whereClause ? whereClause : ' WHERE drop_off_location_uid IS NOT NULL'}
    GROUP BY drop_off_location_uid
    ORDER BY count DESC
    LIMIT 10
  `;

  return await runSQL(query);
}

async function getStateDistribution({ boxSizeFilter, dateRange }) {
  let whereClause = '';
  const dateFilter = getDateFilter(dateRange);

  if (dateFilter) {
    whereClause += dateFilter;
  }

  if (boxSizeFilter !== 'all') {
    whereClause += whereClause ? ` AND box_sizes = '${boxSizeFilter}'` : ` WHERE box_sizes = '${boxSizeFilter}'`;
  }

  const query = `
    SELECT
      receiver_state as state,
      COUNT(*) as count
    FROM gl_shipping_records
    ${whereClause ? whereClause : ' WHERE receiver_state IS NOT NULL'}
    GROUP BY receiver_state
    ORDER BY count DESC
  `;

  return await runSQL(query);
}

async function getRecentShipments({ limit, boxSizeFilter, selectedState }) {
  let whereClause = '';

  if (boxSizeFilter !== 'all') {
    whereClause += ` WHERE box_sizes = '${boxSizeFilter}'`;
  }

  if (selectedState !== 'all') {
    whereClause += whereClause ? ` AND receiver_state = '${selectedState}'` : ` WHERE receiver_state = '${selectedState}'`;
  }

  const query = `
    SELECT
      id,
      tracking_number,
      receiver_name,
      receiver_state,
      ship_date,
      box_sizes,
      box_weight
    FROM gl_shipping_records
    ${whereClause}
    ORDER BY ship_date DESC NULLS LAST
    LIMIT ${parseInt(limit)}
  `;

  return await runSQL(query);
}

// Helper function to generate date filter based on dateRange parameter
function getDateFilter(dateRange) {
  let dateFilter = '';

  if (dateRange === 'last30Days') {
    dateFilter = " WHERE ship_date >= NOW() - INTERVAL '30 days'";
  } else if (dateRange === 'last3Months') {
    dateFilter = " WHERE ship_date >= NOW() - INTERVAL '3 months'";
  } else if (dateRange === 'last6Months') {
    dateFilter = " WHERE ship_date >= NOW() - INTERVAL '6 months'";
  } else if (dateRange === 'lastYear') {
    dateFilter = " WHERE ship_date >= NOW() - INTERVAL '1 year'";
  } else if (dateRange === 'allTime') {
    dateFilter = ''; // No date filter for all time
  }

  return dateFilter;
}
