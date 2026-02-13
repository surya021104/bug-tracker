// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    User, Bell, Palette, Sliders, Database, Link2,
    Mail, Code, Save, RefreshCw
} from 'lucide-react';

export default function SettingsPage({ currentUser }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const userId = currentUser?.empId || 'default-user';
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/settings/${userId}`);
            const data = await res.json();
            setSettings(data);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const userId = currentUser?.empId || 'default-user';
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/settings/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                alert(' Settings saved successfully!');
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert(' Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (path, value) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            const keys = path.split('.');
            let current = newSettings;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'application', label: 'Application', icon: Sliders },
        { id: 'integrations', label: 'Integrations', icon: Link2 },
        { id: 'advanced', label: 'Advanced', icon: Code },
    ];

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div>
                    <h1>⚙️ Settings</h1>
                    <p className="subtitle">Manage your application preferences and configuration</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <RefreshCw size={16} className="spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            <div className="settings-container">
                {/* Sidebar Tabs */}
                <div className="settings-sidebar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h2>User Profile</h2>
                            <p className="section-description">Manage your personal information</p>

                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={settings?.profile?.name || ''}
                                    onChange={e => updateSetting('profile.name', e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={settings?.profile?.email || ''}
                                    onChange={e => updateSetting('profile.email', e.target.value)}
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <input
                                    type="text"
                                    value={settings?.profile?.role || ''}
                                    onChange={e => updateSetting('profile.role', e.target.value)}
                                    placeholder="e.g., Developer, QA Engineer"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h2>Notification Preferences</h2>
                            <p className="section-description">Control how and when you receive notifications</p>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.notifications?.email || false}
                                        onChange={e => updateSetting('notifications.email', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Email Notifications</strong>
                                        <p>Receive bug updates via email</p>
                                    </div>
                                </label>
                            </div>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.notifications?.browser || false}
                                        onChange={e => updateSetting('notifications.browser', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Browser Notifications</strong>
                                        <p>Show desktop notifications for new bugs</p>
                                    </div>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Notification Frequency</label>
                                <select
                                    value={settings?.notifications?.frequency || 'instant'}
                                    onChange={e => updateSetting('notifications.frequency', e.target.value)}
                                >
                                    <option value="instant">Instant</option>
                                    <option value="daily">Daily Digest</option>
                                    <option value="weekly">Weekly Summary</option>
                                </select>
                            </div>

                            <h3 className="subsection-title">Notification Triggers</h3>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.notifications?.triggers?.newBugs || false}
                                        onChange={e => updateSetting('notifications.triggers.newBugs', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>New Bugs</strong>
                                        <p>Notify when new bugs are reported</p>
                                    </div>
                                </label>
                            </div>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.notifications?.triggers?.statusChanges || false}
                                        onChange={e => updateSetting('notifications.triggers.statusChanges', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Status Changes</strong>
                                        <p>Notify when bug status is updated</p>
                                    </div>
                                </label>
                            </div>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.notifications?.triggers?.assignments || false}
                                        onChange={e => updateSetting('notifications.triggers.assignments', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Assignments</strong>
                                        <p>Notify when bugs are assigned to you</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="settings-section">
                            <h2>Appearance</h2>
                            <p className="section-description">Customize the look and feel of the application</p>

                            <div className="form-group">
                                <label>Theme</label>
                                <select
                                    value={settings?.appearance?.theme || 'light'}
                                    onChange={e => updateSetting('appearance.theme', e.target.value)}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto (System)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Accent Color</label>
                                <input
                                    type="color"
                                    value={settings?.appearance?.accentColor || '#3b82f6'}
                                    onChange={e => updateSetting('appearance.accentColor', e.target.value)}
                                />
                                <p className="field-hint">Choose your preferred accent color</p>
                            </div>

                            <div className="form-group">
                                <label>View Density</label>
                                <select
                                    value={settings?.appearance?.viewDensity || 'comfortable'}
                                    onChange={e => updateSetting('appearance.viewDensity', e.target.value)}
                                >
                                    <option value="compact">Compact</option>
                                    <option value="comfortable">Comfortable</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'application' && (
                        <div className="settings-section">
                            <h2>Application Settings</h2>
                            <p className="section-description">Configure default application behavior</p>

                            <div className="form-group">
                                <label>Default Bug Status</label>
                                <select
                                    value={settings?.application?.defaultStatus || 'Todo'}
                                    onChange={e => updateSetting('application.defaultStatus', e.target.value)}
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="Open">Open</option>
                                    <option value="New">New</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Default Severity</label>
                                <select
                                    value={settings?.application?.defaultSeverity || 'Medium'}
                                    onChange={e => updateSetting('application.defaultSeverity', e.target.value)}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.application?.autoAssign || false}
                                        onChange={e => updateSetting('application.autoAssign', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Auto-Assign</strong>
                                        <p>Automatically assign new bugs to default assignee</p>
                                    </div>
                                </label>
                            </div>

                            {settings?.application?.autoAssign && (
                                <div className="form-group">
                                    <label>Default Assignee</label>
                                    <input
                                        type="text"
                                        value={settings?.application?.defaultAssignee || ''}
                                        onChange={e => updateSetting('application.defaultAssignee', e.target.value)}
                                        placeholder="Enter assignee name or team"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="settings-section">
                            <h2>Integrations</h2>
                            <p className="section-description">Connect with external services and tools</p>

                            <div className="form-group">
                                <label>API Key</label>
                                <input
                                    type="password"
                                    value={settings?.integrations?.apiKey || ''}
                                    onChange={e => updateSetting('integrations.apiKey', e.target.value)}
                                    placeholder="Enter your API key"
                                />
                                <p className="field-hint">Used for automated bug ingestion</p>
                            </div>

                            <div className="form-group">
                                <label>Webhook URL</label>
                                <input
                                    type="url"
                                    value={settings?.integrations?.webhookUrl || ''}
                                    onChange={e => updateSetting('integrations.webhookUrl', e.target.value)}
                                    placeholder="https://your-webhook-url.com"
                                />
                                <p className="field-hint">Receive notifications via webhook</p>
                            </div>

                            <div className="form-group">
                                <label>Slack Webhook</label>
                                <input
                                    type="url"
                                    value={settings?.integrations?.slackWebhook || ''}
                                    onChange={e => updateSetting('integrations.slackWebhook', e.target.value)}
                                    placeholder="https://hooks.slack.com/services/..."
                                />
                                <p className="field-hint">Send bug notifications to Slack channel</p>
                            </div>

                            <div className="form-group">
                                <label>GitHub Token</label>
                                <input
                                    type="password"
                                    value={settings?.integrations?.githubToken || ''}
                                    onChange={e => updateSetting('integrations.githubToken', e.target.value)}
                                    placeholder="ghp_..."
                                />
                                <p className="field-hint">Sync bugs with GitHub Issues</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="settings-section">
                            <h2>Advanced Settings</h2>
                            <p className="section-description">Developer and debugging options</p>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.advanced?.debugMode || false}
                                        onChange={e => updateSetting('advanced.debugMode', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Debug Mode</strong>
                                        <p>Enable detailed console logging</p>
                                    </div>
                                </label>
                            </div>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.advanced?.performanceMonitoring || false}
                                        onChange={e => updateSetting('advanced.performanceMonitoring', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Performance Monitoring</strong>
                                        <p>Track application performance metrics</p>
                                    </div>
                                </label>
                            </div>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings?.advanced?.experimentalFeatures || false}
                                        onChange={e => updateSetting('advanced.experimentalFeatures', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <div>
                                        <strong>Experimental Features</strong>
                                        <p>Enable beta features (may be unstable)</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
