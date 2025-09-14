'use client';

import React, { useState, useEffect } from 'react';

export interface SearchResult {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    city: string;
    propertyType: string;
    status: string;
}

interface SearchbarProps {
    onSearchResults: (results: SearchResult[]) => void;
    onSearchActive: (isActive: boolean) => void;
}

export default function Searchbar({ onSearchResults, onSearchActive }: SearchbarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleSearch = async () => {
            if (!searchQuery.trim()) {
                onSearchResults([]);
                onSearchActive(false);
                return;
            }
            onSearchActive(true);
            setIsLoading(true);
            try {
                const res = await fetch('/api/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: searchQuery }),
                });
                if (!res.ok) throw new Error('Network response was not ok');
                const results = await res.json();
                onSearchResults(results.users || []);
            } catch (error) {
                console.error("Error fetching search results:", error);
                onSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, onSearchResults, onSearchActive]);

    return (
        <div className="search-section">
            <input
                className="search-input"
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isLoading && <span className="search-status-message">Searching...</span>}
        </div>
    );
}
