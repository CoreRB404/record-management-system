import { useState, useEffect } from 'react';
import { categoryService, recordService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { IoAdd, IoCreate, IoTrash, IoGrid } from 'react-icons/io5';

const PRESET_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#f43f5e', '#14b8a6', '#f97316', '#06b6d4',
];

const CategoriesPage = () => {
    const { isAdmin } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });

    // bulk delete states (password confirmation)
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteAllCategory, setDeleteAllCategory] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deletingAll, setDeletingAll] = useState(false);

    useEffect(() => {
        fetchCategories();
        const handler = () => fetchCategories();
        window.addEventListener('dataChanged', handler);
        return () => window.removeEventListener('dataChanged', handler);
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getCategories();
            setCategories(res.data.data);
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', color: '#6366f1' });
        setShowModal(true);
    };

    const openDeleteAll = (cat) => {
        setDeleteAllCategory(cat);
        setConfirmPassword('');
        setShowDeleteAllModal(true);
    };

    const handleDeleteAllCategory = async (e) => {
        e.preventDefault();
        if (!confirmPassword) {
            toast.error('Password is required');
            return;
        }
        setDeletingAll(true);
        try {
            await recordService.deleteAllByCategory(deleteAllCategory._id, confirmPassword);
            toast.success(`All records in "${deleteAllCategory.name}" deleted`);
            setShowDeleteAllModal(false);
            setDeleteAllCategory(null);
            fetchCategories();
            window.dispatchEvent(new Event('dataChanged'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setDeletingAll(false);
        }
    };

    const openEdit = (cat) => {
        setEditing(cat);
        setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#6366f1' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) { toast.error('Category name is required'); return; }
        try {
            if (editing) {
                await categoryService.updateCategory(editing._id, form);
                toast.success('Category updated');
            } else {
                await categoryService.createCategory(form);
                toast.success('Category created');
            }
            setShowModal(false);
            fetchCategories();
            window.dispatchEvent(new Event('dataChanged'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await categoryService.deleteCategory(id);
            toast.success('Category deleted');
            fetchCategories();
            window.dispatchEvent(new Event('dataChanged'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cannot delete');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="categories-page">
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p className="page-subtitle">Organize your records with categories</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={openCreate} id="create-category-btn">
                        <IoAdd /> New Category
                    </button>
                )}
            </div>

            {categories.length === 0 ? (
                <div className="empty-state">
                    <IoGrid className="empty-icon" />
                    <h3>No categories yet</h3>
                    <p>Create your first category to organize records.</p>
                </div>
            ) : (
                <div className="categories-grid">
                    {categories.map((cat) => (
                        <div key={cat._id} className="category-card" style={{ '--cat-color': cat.color }}>
                            <div className="category-card-header">
                                <div className="category-color-dot" style={{ background: cat.color }} />
                                <h3>{cat.name}</h3>
                            </div>
                            {cat.description && <p className="category-card-desc">{cat.description}</p>}
                            <div className="category-card-footer">
                                <span className="category-record-count">{cat.recordCount || 0} records</span>
                                {isAdmin && (
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => openEdit(cat)} title="Edit">
                                            <IoCreate />
                                        </button>
                                        <button className="btn-icon btn-delete-all" onClick={() => openDeleteAll(cat)} title="Delete all records">
                                            <IoTrash />
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(cat._id)} title="Delete category">
                                            <IoTrash />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Create Category'}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Name *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" id="category-name" required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={3} id="category-description" />
                    </div>
                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-picker">
                            {PRESET_COLORS.map((c) => (
                                <button key={c} type="button" className={`color-swatch ${form.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                            ))}
                            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="color-input-custom" />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" id="save-category-btn">{editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            {/* delete-all confirmation modal */}
            <Modal isOpen={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} title="Delete all records">
                <form onSubmit={handleDeleteAllCategory} className="modal-form">
                    <p>Enter your password to confirm deletion of every record in the <strong>{deleteAllCategory?.name}</strong> category.</p>
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

export default CategoriesPage;
