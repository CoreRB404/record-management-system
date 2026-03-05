import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { IoLockClosed, IoMail, IoEye, IoEyeOff } from 'react-icons/io5';

const LoginPage = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    if (user) return <Navigate to="/dashboard" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-shapes">
                <div className="shape shape-1" />
                <div className="shape shape-2" />
                <div className="shape shape-3" />
            </div>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            <div className="logo-icon large">R</div>
                        </div>
                        <h1>RecordMS</h1>
                        <p>General Record Management System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <span className="input-icon"><IoMail /></span>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                id="login-email"
                                autoComplete="email"
                            />
                        </div>
                        <div className="input-group">
                            <span className="input-icon"><IoLockClosed /></span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="login-password"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="input-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <IoEyeOff /> : <IoEye />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                            id="login-submit"
                        >
                            {loading ? <span className="spinner-sm" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>&copy; {new Date().getFullYear()} RecordMS. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
