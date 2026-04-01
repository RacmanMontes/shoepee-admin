import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Container, NavDropdown, Badge } from 'react-bootstrap';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiUsers, 
  FiFolder, 
  FiLogOut, 
  FiUser, 
  FiBell,
  FiSettings 
} from 'react-icons/fi';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [admin, setAdmin] = useState({});
    const [notifications] = useState([
        { id: 1, text: 'New order received!', time: '2 min ago' },
        { id: 2, text: 'Product stock low', time: '1 hour ago' },
    ]);

    useEffect(() => {
        const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
        setAdmin(adminData);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: FiHome, label: 'Dashboard', count: null },
        { path: '/products', icon: FiPackage, label: 'Products', count: null },
        { path: '/orders', icon: FiShoppingCart, label: 'Orders', count: '12' },
        { path: '/users', icon: FiUsers, label: 'Users', count: null },
        { path: '/categories', icon: FiFolder, label: 'Categories', count: null },
    ];

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="admin-layout">
            {/* Premium Sidebar */}
            <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-wrapper" onClick={toggleSidebar}>
                        <div className="brand-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 4L4 12L16 20L28 12L16 4Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M4 20L16 28L28 20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M4 16L16 24L28 16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="brand-text">
                                <span className="brand-name">Shoepee</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${active ? 'active' : ''}`}
                            >
                                <div className="nav-icon-wrapper">
                                    <Icon size={20} strokeWidth={1.5} />
                                </div>
                                {!sidebarCollapsed && (
                                    <>
                                        <span className="nav-label">{item.label}</span>
                                       
                                    </>
                                )}
                                {active && <div className="active-indicator" />}
                            </Link>
                        );
                    })}
                </nav>

               
            </aside>

            {/* Main Content Area */}
            <div className="admin-main">
                {/* Premium Top Bar */}
                <header className="top-bar">
                    <div className="top-bar-left">
                        <div className="page-title">
                            <h1>{navItems.find(item => isActive(item.path))?.label || 'Dashboard'}</h1>
                        </div>
                    </div>

                    <div className="top-bar-right">
                       
                        
                        <NavDropdown
                            title={
                                <div className="user-dropdown-trigger">
                                    <div className="user-avatar">
                                        {admin.first_name?.charAt(0)}{admin.last_name?.charAt(0)}
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{admin.first_name} {admin.last_name}</span>
                                        <span className="user-email">{admin.email}</span>
                                    </div>
                                </div>
                            }
                            id="user-dropdown"
                            align="end"
                            className="user-nav-dropdown"
                        >
                          
                            <NavDropdown.Divider />
                            <NavDropdown.Item>
                                <FiUser size={16} /> Profile Settings
                            </NavDropdown.Item>
                            <NavDropdown.Item>
                                <FiSettings size={16} /> Account Settings
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout} className="logout-item">
                                <FiLogOut size={16} /> Logout
                            </NavDropdown.Item>
                        </NavDropdown>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    <Container fluid className="px-4 py-4">
                        <Outlet />
                    </Container>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;