'use client';

import Searchbar from '@/app/searchbar/page';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Buyer {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    city: string;
    propertyType: string;
    status: string;
}

interface CurrentUser {
    sub: string;
    email: string;
}

function BuyersDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [searchResults, setSearchResults] = useState<Buyer[]>([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const currentFilters = {
        city: searchParams.get('city') || '',
        propertyType: searchParams.get('propertyType') || '',
        status: searchParams.get('status') || '',
        timeline: searchParams.get('timeline') || ''
    };

    const dataToDisplay = isSearchActive ? searchResults : buyers;

    useEffect(() => {
        const storedToken = window.sessionStorage.getItem('token');
        if (!storedToken) {
            router.push('/');
        } else {
            setToken(storedToken);
        }
    }, [router]);

    useEffect(() => {
        if (!token) return;

        const verifyAndFetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const verifyRes = await fetch('/api/jwt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (!verifyRes.ok) {
                    window.sessionStorage.removeItem('token');
                    router.push('/');
                    return;
                }

                const userData = await verifyRes.json();
                setCurrentUser(userData.user);

                const queryString = searchParams.toString();
                const buyersRes = await fetch(`/api/buyers?${queryString}`);

                if (buyersRes.ok) {
                    const responseData = await buyersRes.json();
                    if (responseData && Array.isArray(responseData.info)) {
                        setBuyers(responseData.info);
                    } else {
                        setError("Received invalid data from the server.");
                        setBuyers([]);
                    }
                } else {
                    const errorData = await buyersRes.json();
                    setError(errorData.message || 'Failed to fetch buyers.');
                }
            } catch (err) {
                setError('An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        verifyAndFetchData();
    }, [token, searchParams, router]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newParams = new URLSearchParams(searchParams.toString());
        if (value) {
            newParams.set(name, value);
        } else {
            newParams.delete(name);
        }
        router.push(`/buyers?${newParams.toString()}`);
    };
    function exportToCsv(data, filename) {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                if (typeof value === 'object' && value !== null) {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    return (
        <>
            <style>{`
        body { background-color: #f4f7f6; font-family: sans-serif; }
        .dashboard-container { max-width: 1200px; margin: 2rem auto; padding: 2rem; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header h1 { font-size: 2rem; color: #333; }
        .header .user-actions { display: flex; gap: 1rem; }
        .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .filters select { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; color: #333; vertical-align: middle; }
        th { background-color: #f8f8f8; font-weight: 600; color: #111; }
        .status-tag { padding: 0.25rem 0.75rem; border-radius: 12px; color: white; font-size: 0.8rem; text-align: center; display: inline-block; }
        .status-New { background-color: #3498db; }
        .status-Qualified { background-color: #2ecc71; }
        .status-Dropped { background-color: #e74c3c; }
        .status-Contacted, .status-Visited, .status-Negotiation { background-color: #f1c40f; color: #333; }
        .loading, .error, .no-results { text-align: center; font-size: 1.2rem; padding: 2rem; color: #777; }
        .btn { padding: 0.75rem 1.5rem; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        .btn-primary { background-color: #3498db; }
        .btn-secondary { background-color: #95a5a6; }
      `}</style>
            <div className="dashboard-container">
                <div className="header">
                    <h1>Buyers Dashboard</h1>
                    <div className="user-actions">
                        <button onClick={() => router.push(`/buyers/${currentUser?.sub}`)} className="btn btn-secondary" disabled={!currentUser}>View/Edit Profile</button>
                        <button onClick={() => exportToCsv(buyers, 'buyers')} className="btn btn-primary">Export</button>
                </div>
            </div>

            <Searchbar onSearchResults={setSearchResults} onSearchActive={setIsSearchActive} />

            <div className="filters">
                <select name="city" value={currentFilters.city} onChange={handleFilterChange} disabled={isSearchActive}>
                    <option value="">All Cities</option>
                    <option>Chandigarh</option><option>Mohali</option><option>Zirakpur</option><option>Panchkula</option><option>Other</option>
                </select>
                <select name="propertyType" value={currentFilters.propertyType} onChange={handleFilterChange} disabled={isSearchActive}>
                    <option value="">All Property Types</option>
                    <option>Apartment</option><option>Villa</option><option>Plot</option><option>Office</option><option>Retail</option>
                </select>
                <select name="status" value={currentFilters.status} onChange={handleFilterChange} disabled={isSearchActive}>
                    <option value="">All Statuses</option>
                    <option>New</option><option>Qualified</option><option>Contacted</option><option>Visited</option><option>Negotiation</option><option>Converted</option><option>Dropped</option>
                </select>
                <select name="timeline" value={currentFilters.timeline} onChange={handleFilterChange} disabled={isSearchActive}>
                    <option value="">All Timelines</option>
                    <option value="0-3m">0-3 Months</option><option value="3-6m">3-6 Months</option><option value=">6m">&gt;6 Months</option><option>Exploring</option>
                </select>
            </div>

            {isLoading ? (
                <div className="loading">Loading buyers...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Full Name</th><th>Email</th><th>Phone</th><th>City</th><th>Property Type</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {dataToDisplay.length > 0 ? (
                                dataToDisplay.map(buyer => (
                                    <tr key={buyer.id}>
                                        <td>{buyer.fullName}</td>
                                        <td>{buyer.email || '-'}</td>
                                        <td>{buyer.phone}</td>
                                        <td>{buyer.city}</td>
                                        <td>{buyer.propertyType}</td>
                                        <td><span className={`status-tag status-${buyer.status.replace(/\s+/g, '')}`}>{buyer.status}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="no-results">
                                        {isSearchActive ? "No results found." : "No buyers match the current filters."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div >
    </>
  );
}

export default function BuyersPage() {
    return (
        <Suspense fallback={<div className="loading">Loading Dashboard...</div>}>
            <BuyersDashboard />
        </Suspense>
    );
}

