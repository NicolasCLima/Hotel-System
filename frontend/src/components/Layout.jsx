import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈', exact: true },
  { to: '/quartos', label: 'Quartos', icon: '⊞' },
  { to: '/reservas', label: 'Reservas', icon: '⊛' },
];

export default function Layout({ children, title, alert }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⬡</span>
          {sidebarOpen && (
            <div className="brand-text">
              <span className="brand-name">Grand Hotel</span>
              <span className="brand-sub">Management</span>
            </div>
          )}
        </div>
        <div className="gold-line" style={{ margin: '0 16px' }} />
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">{user?.nome?.[0]?.toUpperCase()}</div>
              <div>
                <div className="user-name">{user?.nome}</div>
                <div className="user-role">Administrador</div>
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout} title="Sair">
            <span>⇤</span>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(p => !p)}>
            {sidebarOpen ? '◁' : '▷'}
          </button>
          <div>
            <h2 className="page-title">{title}</h2>
          </div>
          <div className="top-bar-right">
            <span className="user-chip">{user?.nome}</span>
          </div>
        </header>
        {alert && (
          <div className={`global-alert ${alert.type}`}>
            <span>{alert.icon}</span>
            <span>{alert.message}</span>
          </div>
        )}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
