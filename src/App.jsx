import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ApplicationsPage from "./modules/applications/ApplicationsPage";
import "./styles/colorful-components.css";
import "./styles/joyful-animations.css";
import "./styles/joyful-animations.css";



import Login from "./pages/Login";
import Layout from "./components/layout/Layout";
import IssuePage from "./modules/issues/IssuePage";
import BugReportGenerator from "./modules/issues/BugReportGenerator";
import ButtonTestDemo from "./pages/ButtonTestDemo";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TeamPage from "./pages/TeamPage";
import BugBuddyPage from "./pages/BugBuddyPage";
import TestGeneratorPage from "./pages/TestGeneratorPage";
import ApiKeysPage from "./pages/ApiKeysPage/ApiKeysPage";
import "./styles/reports.css";
import "./styles/settings.css";
import "./styles/team.css";

export default function App() {
  const [employee, setEmployee] = useState(null);

  // ✅ Capture bug context from Employee Portal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ctx = params.get("bugContext");

    if (ctx) {
      try {
        const parsed = JSON.parse(decodeURIComponent(ctx));
        localStorage.setItem(
          "incomingBugContext",
          JSON.stringify(parsed)
        );
      } catch (err) {
        console.error("Invalid bug context", err);
      }
    }
  }, []);

  const handleLogout = () => {
    setEmployee(null);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login onLogin={setEmployee} />}
      />
      <Route
        path="/applications"
        element={
          <Layout onLogout={handleLogout}>
            <ApplicationsPage />
          </Layout>
        }
      />


      <Route
        path="/dashboard"
        element={
          <Layout onLogout={handleLogout}>
            <IssuePage currentUser={employee} />
          </Layout>
        }
      />

      <Route
        path="/bugbuddy"
        element={
          <Layout onLogout={handleLogout}>
            <BugBuddyPage currentUser={employee} />
          </Layout>
        }
      />

      <Route
        path="/test-generator"
        element={
          <Layout onLogout={handleLogout}>
            <TestGeneratorPage currentUser={employee} />
          </Layout>
        }
      />

      <Route
        path="/bug-report-generator"
        element={
          <Layout onLogout={handleLogout}>
            <BugReportGenerator currentUser={employee} />
          </Layout>
        }
      />
      <Route
        path="/reports"
        element={
          <Layout onLogout={handleLogout}>
            <ReportsPage currentUser={employee} />
          </Layout>
        }
      />

      <Route
        path="/button-test-demo"
        element={
          <Layout onLogout={handleLogout}>
            <ButtonTestDemo />
          </Layout>
        }
      />

      <Route
        path="/settings"
        element={
          <Layout onLogout={handleLogout}>
            <SettingsPage currentUser={employee} />
          </Layout>
        }
      />

      <Route
        path="/team"
        element={
          <Layout onLogout={handleLogout}>
            <TeamPage />
          </Layout>
        }
      />

      <Route
        path="/api-keys"
        element={
          <Layout onLogout={handleLogout}>
            <ApiKeysPage />
          </Layout>
        }
      />

      {/* Default routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
