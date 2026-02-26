import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { testApi } from '../api/testApi';
import { reportApi } from '../api/reportApi';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [latestTest, setLatestTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState(null);
  const [recentTests, setRecentTests] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, latestRes, trendRes, historyRes] = await Promise.all([
        testApi.getStatistics(user.id),
        testApi.getLatestTest(user.id).catch(() => ({ data: { data: { test: null } } })),
        reportApi.getTrendAnalysis(user.id, 'all').catch(() => null),
        testApi.getUserTests(user.id, { page: 1, limit: 5 }).catch(() => ({ data: { data: [] } }))
      ]);
      
      setStats(statsRes.data.data.statistics);
      setLatestTest(latestRes.data.data.test);
      if (trendRes && trendRes.data?.data?.trend) {
        setTrend(trendRes.data.data.trend);
      }
      if (historyRes?.data?.data) {
        setRecentTests(historyRes.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const classificationData = stats
    ? Object.entries(stats.classificationBreakdown || {}).map(([key, value]) => ({
        classification: key.replace('-', ' '),
        count: value
      }))
    : [];

  const trendData = (trend?.dataPoints || [])
    .map((point) => {
      const parts = String(point.snellen || '').split('/');
      const denom = parseInt(parts[1], 10);
      if (!Number.isFinite(denom)) return null;
      return { ...point, snellenDenominator: denom };
    })
    .filter(Boolean);

  const testsWithTrend = recentTests.map((test, index) => {
    const prev = index < recentTests.length - 1 ? recentTests[index + 1] : null;
    if (!prev) return { ...test, trendDirection: 'none' };

    const parseDenom = (snellen) => {
      if (!snellen) return null;
      const parts = String(snellen).split('/');
      return parseInt(parts[1], 10) || null;
    };

    const currentDen = parseDenom(test.visualAcuity?.snellen);
    const prevDen = parseDenom(prev.visualAcuity?.snellen);
    if (!currentDen || !prevDen) return { ...test, trendDirection: 'none' };

    if (Math.abs(currentDen - prevDen) <= 10) {
      return { ...test, trendDirection: 'stable' };
    }
    if (currentDen < prevDen) {
      return { ...test, trendDirection: 'improved' };
    }
    return { ...test, trendDirection: 'declined' };
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Total Tests</h3>
          <p className="text-3xl font-bold">{stats?.totalTests || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Avg Confidence</h3>
          <p className="text-3xl font-bold">{stats?.avgConfidence || 0}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Avg Accuracy</h3>
          <p className="text-3xl font-bold">{stats?.avgAccuracy || 0}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Last Test Date</h3>
          <p className="text-sm font-semibold">
            {latestTest?.createdAt
              ? new Date(latestTest.createdAt).toLocaleString()
              : 'No tests yet'}
          </p>
        </div>
      </div>

      {latestTest && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Latest Test Result</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Visual Acuity</p>
              <p className="text-2xl font-bold">{latestTest.visualAcuity.snellen}</p>
            </div>
            <div>
              <p className="text-gray-600">Classification</p>
              <p className="text-2xl font-bold capitalize">{latestTest.classification.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {(trendData.length > 0 || classificationData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {trendData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Vision Trend (Snellen)</h2>
              <p className="text-sm text-gray-500 mb-4">
                Snellen denominator over time (lower is better), alongside test confidence.
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      domain={['auto', 'auto']}
                      reversed
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      domain={[0, 100]}
                    />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="snellenDenominator"
                      name="Snellen denominator"
                      stroke="#2563eb"
                      dot={{ r: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="confidenceScore"
                      name="Confidence (%)"
                      stroke="#10b981"
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {classificationData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Classification Distribution</h2>
              <p className="text-sm text-gray-500 mb-4">
                How your tests are distributed across normal, mild, moderate, and severe
                myopia.
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classificationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="classification" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Tests" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {testsWithTrend.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Test History</h2>
          <div className="grid gap-3">
            {testsWithTrend.map((test, index) => {
              const direction = test.trendDirection;
              const arrow =
                direction === 'improved' ? '↑' : direction === 'declined' ? '↓' : '→';
              const arrowColor =
                direction === 'improved'
                  ? 'text-emerald-600'
                  : direction === 'declined'
                  ? 'text-red-600'
                  : 'text-gray-500';

              const createdAt = test.createdAt ? new Date(test.createdAt) : null;

              return (
                <div
                  key={test._id}
                  className="flex justify-between items-center border-b last:border-b-0 pb-2"
                >
                  <div>
                    <p className="text-sm text-gray-500">
                      {createdAt ? createdAt.toLocaleString() : ''}
                    </p>
                    <p className="font-semibold">
                      {test.visualAcuity?.snellen || '—'} ·{' '}
                      <span className="capitalize">
                        {test.classification?.replace('-', ' ') || ''}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-gray-500">Trend</span>
                      <span className={`text-lg font-bold ${arrowColor}`}>{arrow}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Reliability {test.reliability?.confidenceScore ?? '—'}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link
          to="/test"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Take New Test
        </Link>
        <Link
          to="/history"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
        >
          View History
        </Link>
      </div>
    </div>
  );
}

export default DashboardPage;