import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import TrashPage from './pages/TrashPage';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#1e1e2e',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#10b981', secondary: '#1e1e2e' } },
                        error: { iconTheme: { primary: '#f43f5e', secondary: '#1e1e2e' } },
                    }}
                />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/records" element={<RecordsPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute adminOnly>
                                    <UsersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/trash" element={<TrashPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
