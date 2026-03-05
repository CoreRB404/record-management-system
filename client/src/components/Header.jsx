import { IoMenu } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { getGreeting } from '../utils/helpers';

const Header = ({ onMenuToggle }) => {
    const { user } = useAuth();

    return (
        <header className="app-header">
            <div className="header-left">
                <button className="header-menu-btn" onClick={onMenuToggle} id="menu-toggle-btn">
                    <IoMenu />
                </button>
                <div className="header-greeting">
                    <h2>{getGreeting()}, <span className="accent">{user?.firstName}</span></h2>
                </div>
            </div>
            <div className="header-right">
                <div className="header-avatar" id="header-user-avatar">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            </div>
        </header>
    );
};

export default Header;
