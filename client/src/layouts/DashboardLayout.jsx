import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="main-content">
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
