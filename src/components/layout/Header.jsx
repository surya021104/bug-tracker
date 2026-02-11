import { Search, Bell, User, LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Header({ onLogout }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <div className="header">
      <div className="header-left">
        <div className="logo-wrapper">
          <img src="/logo.png" alt="Bug Tracker" className="header-logo" />
        </div>
        <h2 className="header-title">Bug Tracker</h2>
      </div>

      <div className="header-center">
        <div className="header-search">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search bugs, applications, or team members..."
            className="header-search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn">
          <Bell />
          <span className="notification-badge">3</span>
        </button>

        <div className="header-user">
          <div className="user-avatar">
            <User />
          </div>
          <div className="user-info">
            <span className="user-name">Admin</span>
            <span className="user-role">Developer</span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          className="header-icon-btn theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon /> : <Sun />}
        </button>

        <button className="header-icon-btn logout-btn" onClick={handleLogout} title="Logout">
          <LogOut />
        </button>
      </div>
    </div>
  );
}
