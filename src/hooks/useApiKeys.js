import { useState, useEffect } from 'react';

/**
 * Custom hook for API key management
 * Handles fetching, creating, toggling, and deleting API keys
 */
export default function useApiKeys() {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all API keys
    const fetchApiKeys = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/keys`);
            if (!response.ok) throw new Error('Failed to fetch API keys');

            const data = await response.json();
            setApiKeys(data);
            setError(null);
        } catch (err) {
            console.error('Fetch API keys error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Generate new API key
    const generateApiKey = async (keyData) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/keys/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate API key');
            }

            const newKey = await response.json();
            await fetchApiKeys(); // Refresh list
            return newKey;
        } catch (err) {
            console.error('Generate API key error:', err);
            throw err;
        }
    };

    // Toggle API key status (enable/disable)
    const toggleApiKey = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/keys/${id}/toggle`, {
                method: 'PUT'
            });

            if (!response.ok) throw new Error('Failed to toggle API key');

            const result = await response.json();

            // Update local state
            setApiKeys(prevKeys =>
                prevKeys.map(key =>
                    key._id === id ? { ...key, isActive: result.isActive } : key
                )
            );

            return result;
        } catch (err) {
            console.error('Toggle API key error:', err);
            throw err;
        }
    };

    // Delete API key
    const deleteApiKey = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/keys/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete API key');

            // Remove from local state
            setApiKeys(prevKeys => prevKeys.filter(key => key._id !== id));

            return await response.json();
        } catch (err) {
            console.error('Delete API key error:', err);
            throw err;
        }
    };

    // Fetch API keys on mount
    useEffect(() => {
        fetchApiKeys();
    }, []);

    return {
        apiKeys,
        loading,
        error,
        fetchApiKeys,
        generateApiKey,
        toggleApiKey,
        deleteApiKey
    };
}
