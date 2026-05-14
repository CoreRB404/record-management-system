import { useState, useEffect, useCallback } from 'react';
import { recordService, categoryService, reportService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, toInputDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    IoAdd, IoSearch, IoFilter, IoCreate, IoTrash, IoEye,
    IoArrowUp, IoArrowDown, IoRefresh, IoClose, IoCalendar
} from 'react-icons/io5';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const RecordsPage = () => {
    const { isAdmin } = useAuth();
    const [records, setRecords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Filters
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Filter modes: 'range', 'month', 'year'
    const [dateMode, setDateMode] = useState('range');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const tzOffset = new Date().getTimezoneOffset();

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [viewRecord, setViewRecord] = useState(null);

    // Bulk delete modal states (password confirmation)
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deletingAll, setDeletingAll] = useState(false);

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', date: '', category: '', customFields: [],
    });

    const fetchRecords = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 15,
                sortField,
                sortOrder,
                tzOffset,
            };
            if (search) params.search = search;
            if (categoryFilter) params.category = categoryFilter;

            // Apply date mode params
            if (dateMode === 'range') {
                if (dateFrom) params.dateFrom = dateFrom;
                if (dateTo) params.dateTo = dateTo;
            } else if (dateMode === 'month') {
                params.month = selectedMonth + 1;
            } else if (dateMode === 'year') {
                params.dateFrom = `${selectedYear}-01-01`;
                params.dateTo = `${selectedYear}-12-31`;
            }

            const res = await recordService.getRecords(params);
            setRecords(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            toast.error('Failed to load records');
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter, dateFrom, dateTo, sortField, sortOrder, dateMode, selectedMonth, selectedYear]);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getCategories({ active: 'true' });
            setCategories(res.data.data);
        } catch { /* ignore */ }
    };

    const fetchYears = async () => {
        try {
            const res = await reportService.getYears({ tzOffset });
            setAvailableYears(res.data.data);
            if (res.data.data.length > 0 && !res.data.data.includes(selectedYear)) {
                setSelectedYear(res.data.data[0]);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchCategories();
        fetchYears();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchRecords(1), 300);
        return () => clearTimeout(timer);
    }, [fetchRecords]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? <IoArrowUp className="sort-icon" /> : <IoArrowDown className="sort-icon" />;
    };

    const openCreateModal = () => {
        setEditingRecord(null);
        setForm({ title: '', description: '', date: '', category: '', customFields: [] });
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setForm({
            title: record.title,
            description: record.description || '',
            date: toInputDate(record.date),
            category: record.category?._id || '',
            customFields: record.customFields || [],
        });
        setShowModal(true);
    };

    const openViewModal = (record) => {
        setViewRecord(record);
        setShowViewModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.date || !form.category) {
            toast.error('Please fill in all required fields');
            return;
        }
        try {
            if (editingRecord) {
                await recordService.updateRecord(editingRecord._id, form);
                toast.success('Record updated successfully');
            } else {
                await recordService.createRecord(form);
                toast.success('Record created successfully');
            }
            setShowModal(false);
            fetchRecords(pagination.page);
            fetchCategories();
            notifyDataChanged();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const notifyDataChanged = () => {
        // notify other components (categories, dashboard) that records have changed
        window.dispatchEvent(new Event('dataChanged'));
    };

    const openDeleteAllModal = () => {
        if (!categoryFilter) {
            toast.error('Select a category first');
            return;
        }
        setConfirmPassword('');
        setShowDeleteAllModal(true);
    };

    const handleDeleteAll = async (e) => {
        e.preventDefault();
        if (!confirmPassword) {
            toast.error('Please enter your password to confirm');
            return;
        }

        setDeletingAll(true);
        try {
            await recordService.deleteAllByCategory(categoryFilter, confirmPassword);
            toast.success('All records in this category deleted');
            setShowDeleteAllModal(false);
            setConfirmPassword('');
            fetchRecords(1);
            fetchCategories();
            notifyDataChanged();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete all failed');
        } finally {
            setDeletingAll(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await recordService.deleteRecord(id);
            toast.success('Record deleted');
            fetchRecords(pagination.page);
            fetchCategories();
            notifyDataChanged();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const addCustomField = () => {
        setForm({ ...form, customFields: [...form.customFields, { label: '', value: '' }] });
    };

    const updateCustomField = (index, key, value) => {
        const fields = [...form.customFields];
        fields[index][key] = value;
        setForm({ ...form, customFields: fields });
    };

    const removeCustomField = (index) => {
        setForm({ ...form, customFields: form.customFields.filter((_, i) => i !== index) });
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('');
        setDateFrom('');
        setDateTo('');
        setDateMode('range');
        setSelectedMonth(new Date().getMonth());
    };

    const hasActiveFilters = search || categoryFilter || dateFrom || dateTo || dateMode !== 'range';

    return (
        <div className="records-page">
            <div className="page-header">
                <div>
                    <h1>Records</h1>
                    <p className="page-subtitle">Manage your records and entries</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={openCreateModal} id="create-record-btn">
                        <IoAdd /> New Record
                    </button>
                )}
            </div>

            {/* ── Filters ──────────────────────────────────────── */}
            <div className="filters-bar">
                <div className="filter-group search-group">
                    <IoSearch className="filter-icon" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="filter-input"
                        id="search-records"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                    id="filter-category"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
                {categoryFilter && (
                    <button className="btn btn-sm btn-danger" onClick={openDeleteAllModal} style={{ marginLeft: '0.5rem' }}>
                        <IoTrash /> Delete all
                    </button>
                )}
                <div className="date-mode-tabs" id="date-mode-tabs">
                    <button className={`date-mode-tab ${dateMode === 'range' ? 'active' : ''}`} onClick={() => setDateMode('range')}>
                        <IoCalendar /> Range
                    </button>
                    <button className={`date-mode-tab ${dateMode === 'month' ? 'active' : ''}`} onClick={() => setDateMode('month')}>
                        <IoCalendar /> Month
                    </button>
                    <button className={`date-mode-tab ${dateMode === 'year' ? 'active' : ''}`} onClick={() => setDateMode('year')}>
                        <IoCalendar /> Year
                    </button>
                </div>

                <div className="filter-group date-inputs" style={{ display: 'flex', gap: '0.5rem' }}>
                    {dateMode === 'range' && (
                        <>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="filter-input filter-date"
                                placeholder="From"
                                id="filter-date-from"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="filter-input filter-date"
                                placeholder="To"
                                id="filter-date-to"
                            />
                        </>
                    )}

                    {dateMode === 'month' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                            className="filter-select"
                            id="filter-month"
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    )}

                    {dateMode === 'year' && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                            className="filter-select"
                            id="filter-year"
                        >
                            {availableYears.length > 0 ? (
                                availableYears.map(y => <option key={y} value={y}>{y}</option>)
                            ) : (
                                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                            )}
                        </select>
                    )}
                </div>
                {hasActiveFilters && (
                    <button className="btn btn-ghost" onClick={clearFilters} id="clear-filters">
                        <IoClose /> Clear
                    </button>
                )}
            </div>

            {/* ── Table ─────────────────────────────────────────── */}
            {loading ? (
                <LoadingSpinner />
            ) : records.length === 0 ? (
                <div className="empty-state">
                    <IoDocumentText className="empty-icon" />
                    <h3>No records found</h3>
                    <p>Create your first record or adjust your filters.</p>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <IoAdd /> Create Record
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="data-table" id="records-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('title')} className="sortable">
                                        Title <SortIcon field="title" />
                                    </th>
                                    <th>Category</th>
                                    <th onClick={() => handleSort('date')} className="sortable">
                                        Date <SortIcon field="date" />
                                    </th>

                                    <th onClick={() => handleSort('createdAt')} className="sortable">
                                        Created <SortIcon field="createdAt" />
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => (
                                    <tr key={r._id}>
                                        <td className="td-title">
                                            <span className="record-title">{r.title}</span>
                                            {r.description && <span className="record-desc">{r.description.substring(0, 60)}{r.description.length > 60 ? '...' : ''}</span>}
                                        </td>
                                        <td>
                                            <span className="category-badge" style={{ background: `${r.category?.color}22`, color: r.category?.color, borderColor: `${r.category?.color}44` }}>
                                                {r.category?.name || '—'}
                                            </span>
                                        </td>
                                        <td>{formatDate(r.date)}</td>

                                        <td>{formatDate(r.createdAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon btn-view" onClick={() => openViewModal(r)} title="View">
                                                    <IoEye />
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button className="btn-icon btn-edit" onClick={() => openEditModal(r)} title="Edit">
                                                            <IoCreate />
                                                        </button>
                                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(r._id)} title="Delete">
                                                            <IoTrash />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        page={pagination.page}
                        pages={pagination.pages}
                        total={pagination.total}
                        onPageChange={(p) => fetchRecords(p)}
                    />
                </>
            )}

            {/* ── Create / Edit Modal ──────────────────────────── */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingRecord ? 'Edit Record' : 'Create Record'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Record title"
                            id="record-title"
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                id="record-category"
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                id="record-date"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Optional description..."
                            rows={3}
                            id="record-description"
                        />
                    </div>

                    {/* Custom Fields */}
                    <div className="custom-fields-section">
                        <div className="custom-fields-header">
                            <label>Custom Fields</label>
                            <button type="button" className="btn btn-sm btn-ghost" onClick={addCustomField}>
                                <IoAdd /> Add Field
                            </button>
                        </div>
                        {form.customFields.map((f, i) => (
                            <div key={i} className="custom-field-row">
                                <input
                                    type="text"
                                    value={f.label}
                                    onChange={(e) => updateCustomField(i, 'label', e.target.value)}
                                    placeholder="Field name"
                                />
                                <input
                                    type="text"
                                    value={f.value}
                                    onChange={(e) => updateCustomField(i, 'value', e.target.value)}
                                    placeholder="Field value"
                                />
                                <button type="button" className="btn-icon btn-delete" onClick={() => removeCustomField(i)}>
                                    <IoClose />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" id="save-record-btn">
                            {editingRecord ? 'Update Record' : 'Create Record'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ───────────────────────────────────── */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Record Details"
            >
                {viewRecord && (
                    <div className="record-detail">
                        <div className="detail-row">
                            <span className="detail-label">Title</span>
                            <span className="detail-value">{viewRecord.title}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Category</span>
                            <span className="category-badge" style={{ background: `${viewRecord.category?.color}22`, color: viewRecord.category?.color }}>
                                {viewRecord.category?.name}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date</span>
                            <span className="detail-value">{formatDate(viewRecord.date)}</span>
                        </div>
                        {viewRecord.description && (
                            <div className="detail-row">
                                <span className="detail-label">Description</span>
                                <span className="detail-value">{viewRecord.description}</span>
                            </div>
                        )}
                        {viewRecord.customFields?.length > 0 && (
                            <div className="detail-section">
                                <h4>Custom Fields</h4>
                                {viewRecord.customFields.map((f, i) => (
                                    <div className="detail-row" key={i}>
                                        <span className="detail-label">{f.label}</span>
                                        <span className="detail-value">{f.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="detail-row">
                            <span className="detail-label">Created At</span>
                            <span className="detail-value">{formatDate(viewRecord.createdAt)}</span>
                        </div>
                    </div>
                )}
            </Modal>

            {/* delete-all confirmation modal (records) */}
            <Modal isOpen={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} title="Delete all records">
                <form onSubmit={handleDeleteAll} className="modal-form">
                    <p>Type your password to permanently remove every record under the selected category.</p>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteAllModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-danger" disabled={deletingAll}>
                            {deletingAll ? 'Deleting…' : 'Delete all'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// Need this for the empty state
const IoDocumentText = (props) => (
    <svg viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M428 224H288a48 48 0 01-48-48V36a4 4 0 00-4-4h-92a64 64 0 00-64 64v320a64 64 0 0064 64h224a64 64 0 0064-64V228a4 4 0 00-4-4zm-92 160H176a16 16 0 010-32h160a16 16 0 010 32zm0-80H176a16 16 0 010-32h160a16 16 0 010 32z" />
        <path d="M400 112l-80-80v68a12 12 0 0012 12z" />
    </svg>
);

export default RecordsPage;
