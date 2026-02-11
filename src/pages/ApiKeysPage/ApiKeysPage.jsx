import { useState } from 'react';
import useApiKeys from '../../hooks/useApiKeys';
import GenerateKeyModal from './GenerateKeyModal';
import { formatDateOnly } from '../../utils/dateUtils';
import './ApiKeysPage.css';

/**
 * API Keys Management Page
 * Allows users to generate, view, toggle, and delete API keys
 */
export default function ApiKeysPage() {
    const {
        apiKeys,
        loading,
        error,
        generateApiKey,
        toggleApiKey,
        deleteApiKey
    } = useApiKeys();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionMenu, setActionMenu] = useState(null);

    const handleGenerate = async (keyData) => {
        const result = await generateApiKey(keyData);
        return result;
    };

    const handleToggle = async (id) => {
        if (confirm('Are you sure you want to toggle this API key status?')) {
            try {
                await toggleApiKey(id);
            } catch (err) {
                alert('Failed to toggle API key: ' + err.message);
            }
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            try {
                await deleteApiKey(id);
            } catch (err) {
                alert('Failed to delete API key: ' + err.message);
            }
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const toggleActionMenu = (id) => {
        setActionMenu(actionMenu === id ? null : id);
    };

    const getEnvironmentBadge = (env) => {
        const badges = {
            production: '🔴 Prod',
            staging: '🟡 Staging',
            development: '🟢 Dev'
        };
        return badges[env] || env;
    };

    const getUsageColor = (percent) => {
        if (percent >= 90) return 'red';
        if (percent >= 70) return 'orange';
        return 'green';
    };

    if (loading) {
        return (
            <div className="api-keys-page">
                <div className="loading">Loading API keys...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="api-keys-page">
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="api-keys-page">
            <div className="page-header">
                <div className="header-left">
                    <h1>🔐 API Keys</h1>
                    <p>Manage API keys for applications to report errors</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary generate-btn"
                >
                    ➕ Generate New Key
                </button>
            </div>

            {apiKeys.length === 0 ? (
                <div className="empty-state">
                    <p>No API keys yet</p>
                    <p>Generate your first API key to start monitoring applications</p>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        Generate API Key
                    </button>
                </div>
            ) : (
                <div className="keys-table-container">
                    <table className="keys-table">
                        <thead>
                            <tr>
                                <th>Application</th>
                                <th>Environment</th>
                                <th>API Key</th>
                                <th>Usage (Last Hour)</th>
                                <th>Status</th>
                                <th>Owner</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map((key) => (
                                <tr key={key._id} className={!key.isActive ? 'disabled-key' : ''}>
                                    <td>
                                        <strong>{key.appName}</strong>
                                        <br />
                                        <small>{key.appId}</small>
                                    </td>
                                    <td>
                                        <span className={`env-badge ${key.environment}`}>
                                            {getEnvironmentBadge(key.environment)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="key-preview">
                                            {/* Show FULL key if available (requested by user), else preview */}
                                            <code>{key.apiKey || key.apiKeyPreview}</code>
                                            <button
                                                onClick={() => copyToClipboard(key.apiKey || key.apiKeyPreview)}
                                                className="icon-btn"
                                                title="Copy API key"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="usage-info">
                                            <div className="usage-text">
                                                {key.currentUsage} / {key.rateLimit}
                                                <span
                                                    className="usage-percent"
                                                    style={{ color: getUsageColor(key.usagePercent) }}
                                                >
                                                    ({key.usagePercent}%)
                                                </span>
                                            </div>
                                            <div className="usage-bar">
                                                <div
                                                    className="usage-fill"
                                                    style={{
                                                        width: `${Math.min(key.usagePercent, 100)}%`,
                                                        backgroundColor: getUsageColor(key.usagePercent)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${key.isActive ? 'active' : 'inactive'}`}>
                                            {key.isActive ? '✅ Active' : '⭕ Disabled'}
                                        </span>
                                    </td>
                                    <td>{key.owner || '-'}</td>
                                    <td>{formatDateOnly(key.createdAt)}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                onClick={() => toggleActionMenu(key._id)}
                                                className="action-menu-btn"
                                            >
                                                ⋮
                                            </button>
                                            {actionMenu === key._id && (
                                                <div className="action-menu">
                                                    <button onClick={() => handleToggle(key._id)}>
                                                        {key.isActive ? '⭕ Disable' : '✅ Enable'}
                                                    </button>
                                                    <button onClick={() => handleDelete(key._id)} className="danger">
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <GenerateKeyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onGenerate={handleGenerate}
            />
        </div>
    );
}
