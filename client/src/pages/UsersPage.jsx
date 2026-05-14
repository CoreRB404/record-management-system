import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/dataService';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    IoAdd, IoSearch, IoCreate, IoTrash, IoKey, IoPencil,
    IoToggle, IoCheckmarkCircle, IoCloseCircle
} from 'react-icons/io5';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [search, setSearch] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });
    const [newPassword, setNewPassword] = useState('');

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await userService.getUsers({ page, limit: 20, search });
            setUsers(res.data.data);
            setPagination(res.data.pagination);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(1), 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            toast.error('Please fill in all fields');
            return;
        }
        try {
            await userService.createUser(form);
            toast.success('User created successfully');
            setShowCreateModal(false);
            setForm({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await userService.toggleStatus(user._id);
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error('Failed to toggle status');
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.firstName || !editForm.lastName || !editForm.email) {
            toast.error('Please fill in all fields');
            return;
        }
        try {
            await userService.updateUser(selectedUser._id, editForm);
            toast.success('User updated successfully');
            setShowEditModal(false);
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        try {
            await userService.resetPassword(selectedUser._id, { newPassword });
            toast.success('Password reset successfully');
            setShowResetModal(false);
            setNewPassword('');
        } catch (err) {
            toast.error('Failed to reset password');
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete user ${user.firstName} ${user.lastName}?`)) return;
        try {
            await userService.deleteUser(user._id);
            toast.success('User deleted');
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cannot delete user');
        }
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p className="page-subtitle">Manage system users and their access</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} id="create-user-btn">
                    <IoAdd /> New User
                </button>
            </div>

            <div className="filters-bar">
                <div className="filter-group search-group">
                    <IoSearch className="filter-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="filter-input"
                        id="search-users"
                    />
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="data-table" id="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td className="td-user">
                                            <div className="user-avatar-sm">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                                            <span>{u.firstName} {u.lastName}</span>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`role-badge role-${u.role}`}>{u.role}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                                {u.isActive ? <><IoCheckmarkCircle /> Active</> : <><IoCloseCircle /> Inactive</>}
                                            </span>
                                        </td>
                                        <td>{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</td>
                                        <td>{formatDate(u.createdAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon btn-edit" onClick={() => handleEdit(u)} title="Edit User">
                                                    <IoPencil />
                                                </button>
                                                {u.role !== 'admin' && (
                                                    <button className="btn-icon btn-toggle" onClick={() => handleToggleStatus(u)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                                                        <IoToggle />
                                                    </button>
                                                )}
                                                <button className="btn-icon btn-edit" onClick={() => { setSelectedUser(u); setShowResetModal(true); }} title="Reset Password">
                                                    <IoKey />
                                                </button>
                                                <button className="btn-icon btn-delete" onClick={() => handleDelete(u)} title="Delete">
                                                    <IoTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchUsers(p)} />
                </>
            )}

            {/* Create User Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create User">
                <form onSubmit={handleCreate} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required id="user-firstname" />
                        </div>
                        <div className="form-group">
                            <label>Last Name *</label>
                            <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required id="user-lastname" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required id="user-email" />
                    </div>
                    <div className="form-group">
                        <label>Password *</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} id="user-password" />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} id="user-role">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" id="save-user-btn">Create User</button>
                    </div>
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password" size="sm">
                <form onSubmit={handleResetPassword} className="modal-form">
                    <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>
                        Reset password for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
                    </p>
                    <div className="form-group">
                        <label>New Password *</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} id="reset-password-input" />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowResetModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" id="reset-password-btn">Reset Password</button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="sm">
                <form onSubmit={handleEditSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required id="edit-user-firstname" />
                        </div>
                        <div className="form-group">
                            <label>Last Name *</label>
                            <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required id="edit-user-lastname" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required id="edit-user-email" />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" id="save-edit-user-btn">Save Changes</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsersPage;
