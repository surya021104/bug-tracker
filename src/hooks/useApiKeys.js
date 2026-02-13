import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

export default function useApiKeys() {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchApiKeys = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/keys`);
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

    const generateApiKey = async (keyData) => {
        try {
            const response = await fetch(`${API_URL}/api/keys/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate API key');
            }
            const newKey = await response.json();
            await fetchApiKeys();
            return newKey;
        } catch (err) {
            console.error('Generate API key error:', err);
            throw err;
        }
    };

    const toggleApiKey = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/keys/${id}/toggle`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Failed to toggle API key');
            const result = await response.json();
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

    const deleteApiKey = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/keys/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete API key');
            setApiKeys(prevKeys => prevKeys.filter(key => key._id !== id));
            return await response.json();
        } catch (err) {
            console.error('Delete API key error:', err);
            throw err;
        }
    };

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
