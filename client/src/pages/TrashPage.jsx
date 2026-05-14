import { useState, useEffect } from 'react';
import { trashService } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    IoTrash, IoRefresh, IoChevronDown, IoChevronUp, IoClose
} from 'react-icons/io5';

const TrashPage = () => {
    const [grouped, setGrouped] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedCats, setExpandedCats] = useState({});
    const [showEmptyModal, setShowEmptyModal] = useState(false);
    const [emptyTarget, setEmptyTarget] = useState(null); // null = all, or categoryId

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const res = await trashService.getTrash();
            setGrouped(res.data.data.grouped);
            setTotal(res.data.data.total);
            // auto-expand all categories
            const expanded = {};
            res.data.data.grouped.forEach((g) => { expanded[g.categoryName] = true; });
            setExpandedCats(expanded);
        } catch {
            toast.error('Failed to load trash');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const notifyDataChanged = () => {
        window.dispatchEvent(new Event('dataChanged'));
    };

    const toggleCategory = (name) => {
        setExpandedCats((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    // ── Restore single ──────────────────────────────────
    const handleRestore = async (id) => {
        try {
            await trashService.restoreRecord(id);
            toast.success('Record restored');
            fetchTrash();
            notifyDataChanged();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Restore failed');
        }
    };

    // ── Restore all (optionally by category) ────────────
    const handleRestoreAll = async (categoryId) => {
        const params = categoryId ? { category: categoryId } : {};
        try {
            const res = await trashService.restoreAll(params);
            toast.success(res.data.message);
            fetchTrash();
            notifyDataChanged();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Restore failed');
        }
    };

    // ── Permanently delete single ───────────────────────
    const handlePermanentDelete = async (id) => {
        if (!window.confirm('Permanently delete this record? This cannot be undone.')) return;
        try {
            await trashService.permanentlyDelete(id);
            toast.success('Permanently deleted');
            fetchTrash();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    // ── Empty trash ─────────────────────────────────────
    const handleEmptyTrash = async () => {
        const params = emptyTarget ? { category: emptyTarget } : {};
        try {
            const res = await trashService.emptyTrash(params);
            toast.success(res.data.message);
            setShowEmptyModal(false);
            setEmptyTarget(null);
            fetchTrash();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return <LoadingSpinner text="Loading trash..." />;

    return (
        <div className="trash-page">
            <div className="page-header">
                <div>
                    <h1>Trash</h1>
                    <p className="page-subtitle">{total} deleted record{total !== 1 ? 's' : ''}</p>
                </div>

                {total > 0 && (
                    <div className="action-buttons" style={{ gap: '0.5rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => handleRestoreAll()}
                        >
                            <IoRefresh /> Restore All
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => { setEmptyTarget(null); setShowEmptyModal(true); }}
                        >
                            <IoTrash /> Empty Trash
                        </button>
                    </div>
                )}
            </div>

            {total === 0 ? (
                <div className="empty-state">
                    <IoTrash className="empty-icon" />
                    <h3>Trash is empty</h3>
                    <p>Deleted records will appear here.</p>
                </div>
            ) : (
                <div className="trash-categories">
                    {grouped.map((group) => (
                        <div key={group.categoryName} className="trash-category-group">
                            <div
                                className="trash-category-header"
                                onClick={() => toggleCategory(group.categoryName)}
                            >
                                <div className="trash-category-title">
                                    <div
                                        className="category-color-dot"
                                        style={{ background: group.categoryColor }}
                                    />
                                    <h3>{group.categoryName}</h3>
                                    <span className="trash-category-count">
                                        {group.records.length} record{group.records.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="trash-category-actions">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => { e.stopPropagation(); handleRestoreAll(group.categoryId); }}
                                        title="Restore all in this category"
                                    >
                                        <IoRefresh /> Restore
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEmptyTarget(group.categoryId);
                                            setShowEmptyModal(true);
                                        }}
                                        title="Permanently delete all in this category"
                                    >
                                        <IoTrash />
                                    </button>
                                    {expandedCats[group.categoryName]
                                        ? <IoChevronUp className="chevron" />
                                        : <IoChevronDown className="chevron" />
                                    }
                                </div>
                            </div>

                            {expandedCats[group.categoryName] && (
                                <div className="trash-records-list">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Date</th>
                                                <th>Deleted At</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.records.map((item) => (
                                                <tr key={item._id}>
                                                    <td className="td-title">
                                                        <span className="record-title">{item.title}</span>
                                                        {item.description && (
                                                            <span className="record-desc">
                                                                {item.description.substring(0, 60)}
                                                                {item.description.length > 60 ? '...' : ''}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{formatDate(item.date)}</td>
                                                    <td>{formatDate(item.deletedAt)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="btn-icon btn-edit"
                                                                onClick={() => handleRestore(item._id)}
                                                                title="Restore"
                                                            >
                                                                <IoRefresh />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-delete"
                                                                onClick={() => handlePermanentDelete(item._id)}
                                                                title="Delete permanently"
                                                            >
                                                                <IoTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm empty trash modal */}
            <Modal isOpen={showEmptyModal} onClose={() => setShowEmptyModal(false)} title="Empty Trash">
                <div className="modal-form">
                    <p>
                        {emptyTarget
                            ? 'Permanently delete all records in this category from trash? This cannot be undone.'
                            : 'Permanently delete ALL records in the trash? This cannot be undone.'}
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-ghost" onClick={() => setShowEmptyModal(false)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleEmptyTrash}>
                            <IoTrash /> Delete Permanently
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TrashPage;
