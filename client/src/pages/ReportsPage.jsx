import { useState, useEffect } from 'react';
import { reportService, categoryService, userService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, downloadBlob } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    IoBarChart, IoDownload, IoPrint, IoDocumentText, IoCalendar
} from 'react-icons/io5';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#14b8a6'];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const ReportsPage = () => {
    const { isAdmin } = useAuth();
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]); // Still keeping this for now but might remove if not used elsewhere
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [availableYears, setAvailableYears] = useState([]);

    // Date mode: 'range', 'month', 'year'
    const [dateMode, setDateMode] = useState('range');

    // Custom range filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Month picker
    const currentMonth = new Date().getMonth(); // 0-indexed
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Year picker
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Client timezone offset (sent to server for accurate month matching)
    const tzOffset = new Date().getTimezoneOffset();

    // Other filters
    const [categoryFilter, setCategoryFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const promises = [
                    categoryService.getCategories(),
                    reportService.getYears({ tzOffset }),
                ];
                // Only admins can fetch the users list
                if (isAdmin) {
                    promises.push(userService.getUsers({ limit: 100 }));
                }
                const results = await Promise.all(promises);
                setCategories(results[0].data.data);
                const years = results[1].data.data;
                setAvailableYears(years);
                if (years.length > 0) setSelectedYear(years[0]);
                if (isAdmin && results[2]) {
                    setUsers(results[2].data.data);
                }
            } catch { /* ignore */ }
        };
        loadData();
    }, []);

    /**
     * Compute the dateFrom / dateTo params based on the selected mode
     */
    const getDateParams = () => {
        const params = {};

        if (dateMode === 'range') {
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
        } else if (dateMode === 'month') {
            // Send month number (1-12) — backend filters across ALL years
            params.month = selectedMonth + 1;
        } else if (dateMode === 'year') {
            // Jan 1 to Dec 31 of selected year
            params.dateFrom = `${selectedYear}-01-01`;
            params.dateTo = `${selectedYear}-12-31`;
        }

        // Always send timezone for accurate date matching
        params.tzOffset = tzOffset;

        return params;
    };

    const buildParams = () => {
        const params = getDateParams();
        if (categoryFilter) params.category = categoryFilter;
        if (userFilter) params.userId = userFilter;
        return params;
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            const params = buildParams();
            const res = await reportService.getReport(params);
            setReport(res.data.data);
            toast.success('Report generated');
        } catch {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            const params = buildParams();
            const res = await reportService.exportPDF(params);
            downloadBlob(new Blob([res.data]), `report_${Date.now()}.pdf`);
            toast.success('PDF downloaded');
        } catch {
            toast.error('Failed to export PDF');
        }
    };

    const handleExportCSV = async () => {
        try {
            const params = buildParams();
            const res = await reportService.exportCSV(params);
            downloadBlob(new Blob([res.data]), `report_${Date.now()}.csv`);
            toast.success('CSV downloaded');
        } catch {
            toast.error('Failed to export CSV');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Years come from the database — only years that actually have data
    const yearOptions = availableYears;

    /**
     * Get a readable label for the active date filter
     */
    const getDateLabel = () => {
        if (dateMode === 'month') return `${MONTHS[selectedMonth]} (All Years)`;
        if (dateMode === 'year') return `Year ${selectedYear}`;
        if (dateFrom && dateTo) return `${dateFrom} — ${dateTo}`;
        if (dateFrom) return `From ${dateFrom}`;
        if (dateTo) return `Until ${dateTo}`;
        return 'All time';
    };

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Reports</h1>
                    <p className="page-subtitle">Generate and export reports</p>
                </div>
                {report && (
                    <div className="page-header-actions">
                        <button className="btn btn-outline" onClick={handleExportCSV} id="export-csv-btn">
                            <IoDownload /> CSV
                        </button>
                        <button className="btn btn-outline" onClick={handleExportPDF} id="export-pdf-btn">
                            <IoDownload /> PDF
                        </button>
                        <button className="btn btn-outline" onClick={handlePrint} id="print-report-btn">
                            <IoPrint /> Print
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="report-filters">
                {/* Date Mode Tabs */}
                <div className="date-mode-tabs" id="date-mode-tabs">
                    <button
                        className={`date-mode-tab ${dateMode === 'range' ? 'active' : ''}`}
                        onClick={() => setDateMode('range')}
                        id="date-mode-range"
                    >
                        <IoCalendar /> Date Range
                    </button>
                    <button
                        className={`date-mode-tab ${dateMode === 'month' ? 'active' : ''}`}
                        onClick={() => setDateMode('month')}
                        id="date-mode-month"
                    >
                        <IoCalendar /> Month
                    </button>
                    <button
                        className={`date-mode-tab ${dateMode === 'year' ? 'active' : ''}`}
                        onClick={() => setDateMode('year')}
                        id="date-mode-year"
                    >
                        <IoCalendar /> Year
                    </button>
                </div>

                <div className="filters-bar">
                    {/* Date inputs based on mode */}
                    {dateMode === 'range' && (
                        <>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="filter-input filter-date"
                                id="report-date-from"
                            />
                            <span className="filter-separator">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="filter-input filter-date"
                                id="report-date-to"
                            />
                        </>
                    )}

                    {dateMode === 'month' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="filter-select"
                            id="report-month"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    )}

                    {dateMode === 'year' && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="filter-select filter-year-select"
                            id="report-year"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    )}

                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select" id="report-category">
                        <option value="">All Categories</option>
                        {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    {/* user filter removed */}
                    <button className="btn btn-primary" onClick={generateReport} disabled={loading} id="generate-report-btn">
                        <IoBarChart /> {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {/* Report Content */}
            {loading && <LoadingSpinner text="Generating report..." />}

            {report && !loading && (
                <div className="report-content" id="report-content">
                    {/* Summary Cards */}
                    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card" style={{ '--accent': '#6366f1' }}>
                            <div className="stat-icon" style={{ background: '#6366f122', color: '#6366f1' }}><IoDocumentText /></div>
                            <div className="stat-info">
                                <span className="stat-value">{report.summary.totalRecords}</span>
                                <span className="stat-label">Total Records</span>
                            </div>
                        </div>
                        <div className="stat-card" style={{ '--accent': '#10b981' }}>
                            <div className="stat-icon" style={{ background: '#10b98122', color: '#10b981' }}><IoCalendar /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: '1rem' }}>{getDateLabel()}</span>
                                <span className="stat-label">Period</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3 className="chart-title">Records by Category</h3>
                            {report.summary.recordsByCategory?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={report.summary.recordsByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="name" label={({ name, count }) => `${name}: ${count}`}>
                                            {report.summary.recordsByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="chart-empty">No data</div>}
                        </div>

                    </div>

                    {/* Records Table */}
                    <div className="chart-card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="chart-title">Records ({report.records.length})</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.records.map((r, i) => (
                                        <tr key={r._id}>
                                            <td>{i + 1}</td>
                                            <td>{r.title}</td>
                                            <td>
                                                <span className="category-badge" style={{ background: `${r.category?.color}22`, color: r.category?.color }}>{r.category?.name || '—'}</span>
                                            </td>
                                            <td>{formatDate(r.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
