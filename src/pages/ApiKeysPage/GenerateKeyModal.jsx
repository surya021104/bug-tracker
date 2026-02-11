import { useState } from 'react';
import PropTypes from 'prop-types';
import './ApiKeysPage.css';

/**
 * Modal for generating new API keys
 */
export default function GenerateKeyModal({ isOpen, onClose, onGenerate }) {
    const [formData, setFormData] = useState({
        appName: '',
        environment: 'production',
        rateLimit: 1000,
        owner: ''
    });
    const [generatedKey, setGeneratedKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rateLimit' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await onGenerate(formData);
            setGeneratedKey(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            appName: '',
            environment: 'production',
            rateLimit: 1000,
            owner: ''
        });
        setGeneratedKey(null);
        setError(null);
        onClose();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('API key copied to clipboard!');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {!generatedKey ? (
                    <>
                        <h2>Generate New API Key</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="appName">Application Name *</label>
                                <input
                                    type="text"
                                    id="appName"
                                    name="appName"
                                    value={formData.appName}
                                    onChange={handleChange}
                                    placeholder="e.g., HR Management System"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="environment">Environment *</label>
                                <select
                                    id="environment"
                                    name="environment"
                                    value={formData.environment}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="development">Development</option>
                                    <option value="staging">Staging</option>
                                    <option value="production">Production</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="rateLimit">Rate Limit (errors/hour)</label>
                                <input
                                    type="number"
                                    id="rateLimit"
                                    name="rateLimit"
                                    value={formData.rateLimit}
                                    onChange={handleChange}
                                    min="100"
                                    max="10000"
                                />
                                <small>
                                    Recommended: Dev (5000), Staging (2000), Production (1000)
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="owner">Owner (optional)</label>
                                <input
                                    type="text"
                                    id="owner"
                                    name="owner"
                                    value={formData.owner}
                                    onChange={handleChange}
                                    placeholder="Team or person responsible"
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="modal-actions">
                                <button type="button" onClick={handleClose} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h2>✅ API Key Generated!</h2>
                        <div className="success-content">
                            <div className="warning-box">
                                <strong>⚠️ Save this key securely!</strong>
                                <p>You won&apos;t be able to see it again. Copy it now.</p>
                            </div>

                            <div className="key-display">
                                <label>API Key:</label>
                                <div className="key-value">
                                    <code>{generatedKey.apiKey}</code>
                                    <button
                                        onClick={() => copyToClipboard(generatedKey.apiKey)}
                                        className="copy-btn"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>

                            <div className="key-details">
                                <p><strong>Application:</strong> {generatedKey.appName}</p>
                                <p><strong>Environment:</strong> {generatedKey.environment}</p>
                                <p><strong>App ID:</strong> {generatedKey.appId}</p>
                                <p><strong>Rate Limit:</strong> {generatedKey.rateLimit} errors/hour</p>
                            </div>

                            <div className="integration-snippets">
                                <h3>Quick Integration</h3>
                                <p>Paste one of these snippets into your target application.</p>

                                <div className="snippet-block">
                                    <h4>HTML (script tag)</h4>
                                    <pre>
{`<script src="https://YOUR-DASHBOARD-DOMAIN/complete-bug-monitor.js"></script>
<script>
  window.BUG_TRACKER_CONFIG = {
    apiKey: "${generatedKey.apiKey}",
    endpoint: "http://localhost:4000/api/bugs/ingest",
    environment: "${generatedKey.environment}"
  };
</script>`}
                                    </pre>
                                </div>

                                <div className="snippet-block">
                                    <h4>React / SPA (SDK)</h4>
                                    <pre>
{`import { initBugTracker } from "./utils/bugSdk";

initBugTracker({
  apiKey: "${generatedKey.apiKey}",
  endpoint: "http://localhost:4000/api/bugs/ingest",
  environment: "${generatedKey.environment}",
  getUser: () => window.currentUser || null,
});`}
                                    </pre>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button onClick={handleClose} className="btn-primary">
                                    Done
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

GenerateKeyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onGenerate: PropTypes.func.isRequired
};
