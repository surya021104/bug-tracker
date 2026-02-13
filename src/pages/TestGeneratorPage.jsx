import { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Loader, FileSpreadsheet } from 'lucide-react';
import '../styles/test-generator.css';

export default function TestGeneratorPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [testCases, setTestCases] = useState([]);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            // Validate file type
            const validExtensions = ['.xls', '.xlsx'];
            const fileExtension = droppedFile.name.toLowerCase().slice(droppedFile.name.lastIndexOf('.'));

            if (validExtensions.includes(fileExtension)) {
                setFile(droppedFile);
                setError(null);
                setResult(null);
            } else {
                setError('Please upload a valid Excel file (.xls or .xlsx)');
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleUploadAndGenerate = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('excelFile', file);

            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/test-cases/parse`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate test cases');
            }

            setResult(data);
            setTestCases(data.testCases || []);
            console.log('✅ Test cases generated successfully:', data.summary);

        } catch (err) {
            console.error('❌ Generation failed:', err);
            setError(err.message || 'An error occurred while generating test cases');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = () => {
        if (!result || !result.specContent) {
            return;
        }

        // Create blob and download
        const blob = new Blob([result.specContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || 'generated-tests.spec.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="test-generator-page">
            <div className="page-header">
                <div className="header-content">
                    <FileSpreadsheet className="header-icon" size={36} />
                    <div>
                        <h1>Test Case Generator</h1>
                        <p>Convert Excel test cases to Playwright spec.js files</p>
                    </div>
                </div>
            </div>

            <div className="generator-container">
                {/* Upload Section */}
                <div className="upload-section card">
                    <h2>
                        <Upload size={24} />
                        Upload Test Cases
                    </h2>

                    <div
                        className={`drop-zone ${file ? 'has-file' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <FileSpreadsheet className="drop-icon" size={48} />

                        {file ? (
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{formatFileSize(file.size)}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="drop-text">Drag & drop your Excel file here</p>
                                <p className="drop-subtext">or click to browse</p>
                            </div>
                        )}

                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            onChange={handleFileSelect}
                            className="file-input"
                        />
                    </div>

                    {file && (
                        <button
                            className="generate-btn"
                            onClick={handleUploadAndGenerate}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader className="spinning" size={20} />
                                    Generating Tests...
                                </>
                            ) : (
                                <>
                                    <FileText size={20} />
                                    Generate Playwright Tests
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="card error-card">
                        <AlertCircle size={24} />
                        <div>
                            <h3>Error</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Result */}
                {result && (
                    <>
                        {/* Summary Section */}
                        <div className="card success-card">
                            <CheckCircle size={24} />
                            <div>
                                <h3>Test Cases Generated Successfully!</h3>
                                <div className="summary-stats">
                                    <div className="stat">
                                        <span className="stat-label">Total Tests:</span>
                                        <span className="stat-value">{result.summary.totalTests}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Modules:</span>
                                        <span className="stat-value">{result.summary.moduleCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="card preview-section">
                            <h2>
                                <FileText size={24} />
                                Test Case Preview
                            </h2>

                            <div className="table-container">
                                <table className="test-cases-table">
                                    <thead>
                                        <tr>
                                            <th>Test ID</th>
                                            <th>Scenario</th>
                                            <th>Module</th>
                                            <th>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testCases.map((tc, index) => (
                                            <tr key={index}>
                                                <td className="test-id">{tc.testId}</td>
                                                <td className="scenario">{tc.scenario}</td>
                                                <td className="module">{tc.module}</td>
                                                <td className="priority">
                                                    <span className={`priority-badge ${tc.priority.toLowerCase()}`}>
                                                        {tc.priority}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Download Section */}
                        <div className="card download-section">
                            <h2>
                                <Download size={24} />
                                Download Generated Tests
                            </h2>

                            <p className="download-description">
                                Your Playwright test file is ready! Click below to download the .spec.js file.
                            </p>

                            <button className="download-btn" onClick={handleDownload}>
                                <Download size={20} />
                                Download {result.fileName}
                            </button>

                            <div className="code-preview">
                                <div className="code-preview-header">
                                    <span>Preview:</span>
                                    <span className="code-language">JavaScript</span>
                                </div>
                                <pre>
                                    <code>{result.specContent.substring(0, 800)}...</code>
                                </pre>
                            </div>
                        </div>
                    </>
                )}

                {/* Instructions */}
                {!result && !uploading && (
                    <div className="card instructions-card">
                        <h2>📋 How to Use</h2>
                        <ol>
                            <li>Upload your Excel file containing test cases (.xls or .xlsx)</li>
                            <li>The parser will automatically detect columns like:
                                <ul>
                                    <li><strong>Test Case ID</strong> or <strong>Test Case #</strong></li>
                                    <li><strong>Scenario</strong> or <strong>Test Description</strong></li>
                                    <li><strong>Module</strong> or <strong>Category</strong></li>
                                    <li><strong>Expected Result</strong> (optional)</li>
                                    <li><strong>Priority</strong> (optional)</li>
                                </ul>
                            </li>
                            <li>Click "Generate Playwright Tests" to create the spec.js file</li>
                            <li>Review the generated test cases in the preview</li>
                            <li>Download the .spec.js file and place it in your <code>tests/</code> folder</li>
                            <li>Customize the generated tests with your specific selectors and logic</li>
                        </ol>

                        <div className="info-note">
                            <AlertCircle size={20} />
                            <p>
                                <strong>Note:</strong> The generated tests are templates. You'll need to add specific
                                selectors, actions, and assertions for your application.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
