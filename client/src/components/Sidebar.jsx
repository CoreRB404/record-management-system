import {
    IoHome, IoDocumentText, IoGrid, IoPeople, IoBarChart,
    IoLogOut, IoMenu, IoClose, IoChevronDown, IoSettings, IoTrash
} from 'react-icons/io5';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Sidebar = ({ isOpen, onToggle }) => {
    const { user, isAdmin, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const adminLinks = [
        { to: '/dashboard', icon: <IoHome />, label: 'Dashboard' },
        { to: '/records', icon: <IoDocumentText />, label: 'Records' },
        { to: '/categories', icon: <IoGrid />, label: 'Categories' },
        { to: '/users', icon: <IoPeople />, label: 'Users' },
        { to: '/reports', icon: <IoBarChart />, label: 'Reports' },
        { to: '/trash', icon: <IoTrash />, label: 'Trash' },
    ];

    const userLinks = [
        { to: '/dashboard', icon: <IoHome />, label: 'Dashboard' },
        { to: '/records', icon: <IoDocumentText />, label: 'Records' },
        { to: '/categories', icon: <IoGrid />, label: 'Categories' },
        { to: '/reports', icon: <IoBarChart />, label: 'Reports' },
        { to: '/trash', icon: <IoTrash />, label: 'Trash' },
    ];

    const links = isAdmin ? adminLinks : userLinks;

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onToggle} />
            <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">R</div>
                        {!collapsed && <span className="logo-text">RecordMS</span>}
                    </div>
                    <button className="sidebar-collapse-btn mobile-only" onClick={onToggle}>
                        <IoClose />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => window.innerWidth < 768 && onToggle()}
                            id={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            {!collapsed && <span className="sidebar-link-text">{link.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{user?.firstName} {user?.lastName}</span>
                                <span className="sidebar-user-role">{user?.role}</span>
                            </div>
                        )}
                    </div>
                    <button className="sidebar-link logout-btn" onClick={logout} id="logout-btn">
                        <span className="sidebar-link-icon"><IoLogOut /></span>
                        {!collapsed && <span className="sidebar-link-text">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
