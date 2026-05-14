import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDateTime, formatDate } from '../utils/helpers';
import { IoPeople, IoDocumentText, IoCalendar, IoGrid, IoTrendingUp } from 'react-icons/io5';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#14b8a6'];

const DashboardPage = () => {
    const { isAdmin } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
        const handler = () => fetchDashboard();
        window.addEventListener('dataChanged', handler);
        return () => window.removeEventListener('dataChanged', handler);
    }, [isAdmin]);

    const fetchDashboard = async () => {
        try {
            const res = isAdmin
                ? await dashboardService.getAdminDashboard()
                : await dashboardService.getUserDashboard();
            setData(res.data.data);
        } catch (err) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;
    if (!data) return <p>Failed to load dashboard data.</p>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</h1>
                <p className="page-subtitle">Overview of your record management system</p>
            </div>

            {/* ── Stats Cards ───────────────────────────────────────── */}
            <div className="stats-grid">
                {isAdmin ? (
                    <>
                        <StatCard icon={<IoPeople />} label="Total Users" value={data.stats.totalUsers} color="#6366f1" />
                        <StatCard icon={<IoDocumentText />} label="Total Records" value={data.stats.totalRecords} color="#10b981" />
                        <StatCard icon={<IoCalendar />} label="This Month" value={data.stats.recordsThisMonth} color="#f59e0b" />
                        <StatCard icon={<IoGrid />} label="Categories" value={data.stats.totalCategories} color="#ec4899" />
                    </>
                ) : (
                    <>
                        <StatCard icon={<IoDocumentText />} label="Total Records" value={data.stats.totalRecords} color="#6366f1" />
                        <StatCard icon={<IoCalendar />} label="This Month" value={data.stats.recordsThisMonth} color="#10b981" />
                    </>
                )}
            </div>

            {/* ── Charts ────────────────────────────────────────────── */}
            <div className="charts-grid">
                {/* Records by Category - Pie Chart */}
                <div className="chart-card">
                    <h3 className="chart-title">Records by Category</h3>
                    {data.recordsByCategory?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data.recordsByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="name"
                                    label={({ name, count }) => `${name}: ${count}`}
                                >
                                    {data.recordsByCategory.map((entry, i) => (
                                        <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-empty">No data yet</div>
                    )}
                </div>

                {/* Recent Records */}
                <div className="chart-card">
                    <h3 className="chart-title">Recent Records</h3>
                    <div className="recent-list">
                        {data.recentRecords?.length > 0 ? (
                            data.recentRecords.map((r) => (
                                <div key={r._id} className="recent-item">
                                    <div className="recent-item-dot" style={{ background: r.category?.color || '#6366f1' }} />
                                    <div className="recent-item-info">
                                        <span className="recent-item-title">{r.title}</span>
                                        <span className="recent-item-meta">
                                            {r.category?.name} · {formatDate(r.date)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="chart-empty">No records yet</div>
                        )}
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3 className="chart-title">Records by Month</h3>
                        {data.recordsByMonth?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data.recordsByMonth.map((m) => ({
                                    month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
                                    count: m.count,
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No data yet</div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Upcoming Records ─────────────────────────── */}
            {data.upcomingRecords?.length > 0 && (
                <div className="chart-card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="chart-title">
                        <IoTrendingUp style={{ marginRight: 8 }} />
                        Upcoming Records
                    </h3>
                    <div className="recent-list">
                        {data.upcomingRecords.map((r) => (
                            <div key={r._id} className="recent-item">
                                <div className="recent-item-dot" style={{ background: r.category?.color || '#6366f1' }} />
                                <div className="recent-item-info">
                                    <span className="recent-item-title">{r.title}</span>
                                    <span className="recent-item-meta">
                                        {r.category?.name} · {formatDate(r.date)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="stat-card" style={{ '--accent': color }}>
        <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
        <div className="stat-info">
            <span className="stat-value">{value ?? 0}</span>
            <span className="stat-label">{label}</span>
        </div>
    </div>
);

export default DashboardPage;
