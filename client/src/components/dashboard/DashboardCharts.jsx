import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const PALETTE = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#64748b'];

function ChartCard({ title, description, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
      <div className="mt-3 h-[240px] w-full">{children}</div>
    </div>
  );
}

function EmptyState({ message = 'Not enough data yet' }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
      {message}
    </div>
  );
}

function aggregateCounts(items, field, fallback = 'Other') {
  const map = new Map();
  for (const item of items) {
    const raw = item?.[field];
    const label = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
    map.set(label, (map.get(label) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const pieTooltip = {
  formatter: (value, name) => [`${value}`, name],
  contentStyle: { borderRadius: '8px', border: '1px solid #e5e7eb' }
};

export function DonatorDashboardCharts({ posts, stats, loading }) {
  const statusData = [
    { name: 'Active', value: stats.open },
    { name: 'In progress', value: stats.inProgress },
    { name: 'Donated', value: stats.donated }
  ];
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);
  const categoryData = aggregateCounts(posts || [], 'category');

  if (loading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[308px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        <div className="h-[308px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Posts by status" description="How your listings are distributed">
        {statusTotal === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip {...pieTooltip} />
              <Legend verticalAlign="bottom" height={28} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Posts by category" description="Where you are offering the most help">
        {categoryData.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="value" name="Posts" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, index) => (
                  <Cell key={`cat-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

export function ReceiverDashboardCharts({ needs, stats, loading }) {
  const statusData = [
    { name: 'Active', value: stats.open },
    { name: 'Partial', value: stats.partial },
    { name: 'Fulfilled', value: stats.fulfilled }
  ];
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);
  const categoryData = aggregateCounts(needs || [], 'category');
  const urgencyData = aggregateCounts(needs || [], 'urgency', 'medium');
  const secondChartData = categoryData.length > 0 ? categoryData : urgencyData;
  const secondTitle = categoryData.length > 0 ? 'Needs by category' : 'Needs by urgency';
  const secondDesc =
    categoryData.length > 0 ? 'What you request most often' : 'How urgent your open needs are';

  if (loading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[308px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        <div className="h-[308px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Needs by status" description="Open, partially met, and completed">
        {statusTotal === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip {...pieTooltip} />
              <Legend verticalAlign="bottom" height={28} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={secondTitle} description={secondDesc}>
        {secondChartData.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={secondChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="value" name="Needs" radius={[4, 4, 0, 0]}>
                {secondChartData.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

export function AdminDashboardCharts({ stats, loading }) {
  const userMix = [
    { name: 'Donators', value: stats.donatorCount },
    { name: 'Receivers', value: stats.receiverCount }
  ];
  const userTotal = userMix.reduce((s, d) => s + d.value, 0);

  const platformBars = [
    { name: 'Donations (posted)', value: stats.totalDonations },
    { name: 'Donations (fulfilled)', value: stats.donatedCount },
    { name: 'Needs (posted)', value: stats.totalNeeds },
    { name: 'Needs (fulfilled)', value: stats.fulfilledNeedsCount }
  ];

  if (loading) {
    return (
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[308px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        <div className="h-[308px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Users by role" description="Donators vs receivers / NGOs">
        {userTotal === 0 ? (
          <EmptyState message="No user role data" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={userMix}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={86}
                paddingAngle={2}
              >
                {userMix.map((_, index) => (
                  <Cell key={`role-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip {...pieTooltip} />
              <Legend verticalAlign="bottom" height={28} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Platform throughput" description="Posted vs fulfilled for donations and needs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={platformBars} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={132} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Bar dataKey="value" name="Count" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
