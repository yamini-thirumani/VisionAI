import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { testApi } from '../api/testApi';
import { Link } from 'react-router-dom';
import { downloadSummaryPdf } from '../utils/visionPdf';
import { cell, NA } from '../utils/display';

function HistoryPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [summaryBusy, setSummaryBusy] = useState(false);

  const userId = user?.id || user?._id;

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const response = await testApi.getUserTests(userId, { page: 1, limit: 20 });
        setTests(response.data.data || []);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [userId]);

  const handleDownloadSummary = async () => {
    if (!userId) return;
    setSummaryBusy(true);
    try {
      const response = await testApi.getUserTests(userId, { page: 1, limit: 100 });
      const list = response.data?.data || [];
      downloadSummaryPdf(list, user?.name || 'Patient');
    } catch (error) {
      console.error('Error building summary PDF:', error);
    } finally {
      setSummaryBusy(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const withTrend = tests.map((test, index) => {
    const prev = index < tests.length - 1 ? tests[index + 1] : null;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">Test history</h1>
        {withTrend.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadSummary}
            disabled={summaryBusy}
            className="bg-white border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
          >
            {summaryBusy ? 'Preparing PDF…' : 'Download summary PDF'}
          </button>
        )}
      </div>

      {withTrend.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No tests yet</p>
          <Link to="/test" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Take Your First Test
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {withTrend.map((test) => {
            const isExpanded = expandedId === test._id;
            const direction = test.trendDirection;
            const arrow =
              direction === 'improved' ? '↑' : direction === 'declined' ? '↓' : '→';
            const arrowColor =
              direction === 'improved'
                ? 'text-emerald-600'
                : direction === 'declined'
                ? 'text-red-600'
                : 'text-gray-500';

            return (
              <div
                key={test._id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : test._id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">{test.visualAcuity.snellen}</p>
                    <p className="text-gray-600 capitalize">
                      {test.classification.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(test.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600">Trend</span>
                      <span className={`text-xl font-bold ${arrowColor}`}>{arrow}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs uppercase text-gray-500 mb-1">LogMAR</p>
                        <p className="font-semibold tabular-nums">
                          {cell(test.visualAcuity?.logMAR)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500 mb-1">Decimal</p>
                        <p className="font-semibold tabular-nums">
                          {cell(test.visualAcuity?.decimal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          Avg Distance
                        </p>
                        <p className="font-semibold tabular-nums">
                          {test.testConditions?.averageDistance != null
                            ? `${test.testConditions.averageDistance} cm`
                            : NA}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500 mb-1">Pauses</p>
                        <p className="font-semibold">
                          {(test.reliability?.pauses || test.testConditions?.violations || [])
                            .length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-gray-500">
                        Tap the card again to collapse details.
                      </p>
                      <Link
                        to={`/results/${test._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        View Full Report →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;


