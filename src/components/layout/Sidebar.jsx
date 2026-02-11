import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, AppWindow, FileText, Users, Settings, Bot, FlaskConical, FileSpreadsheet, Key } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <LayoutDashboard />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/applications"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <AppWindow />
        <span>Applications</span>
      </NavLink>

      <NavLink
        to="/bugbuddy"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <FlaskConical />
        <span>BugBuddy</span>
      </NavLink>

      <NavLink
        to="/test-generator"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <FileSpreadsheet />
        <span>Test Generator</span>
      </NavLink>

      <NavLink
        to="/bug-report-generator"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <Bot />
        <span>AI Bug Reports</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <FileText />
        <span>Reports</span>
      </NavLink>

      <NavLink
        to="/api-keys"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <Key />
        <span>API Keys</span>
      </NavLink>

      <NavLink
        to="/team"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <Users />
        <span>Team</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => isActive ? "active" : ""}
      >
        <Settings />
        <span>Settings</span>
      </NavLink>

      {/* Bug Image Section */}
      <div className="sidebar-image">
        <img src="/bug.jpg" alt="Bug Tracker" />
      </div>
    </div>
  );
}
