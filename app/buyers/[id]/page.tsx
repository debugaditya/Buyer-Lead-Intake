'use client';

import React, { use, useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

interface BuyerProfilePageProps {
    params: Promise<{ id: string }>;
}

interface BuyerProfileData {
    id?: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    propertyType?: string | null;
    bhk?: string | null;
    purpose?: string | null;
    status?: string | null;
    budgetMin?: number | string | null;
    budgetMax?: number | string | null;
    timeline?: string | null;
    source?: string | null;
    notes?: string | null;
    tags?: string[] | string | null;
    [key: string]: any;
}

const BuyerProfileSchema = z.object({
    fullName: z.coerce.string().min(2, { message: 'Full name must be at least 2 characters.' }).optional().nullable(),
    email: z.string().email({ message: 'Invalid email format.' }).or(z.literal('')).optional().nullable(),
    phone: z.coerce.string().min(10, { message: "Invalid phone number. The number must be between 10 and 15 characters long." }).max(15, { message: "Invalid phone number. The number must be between 10 and 15 characters long." }),
    budgetMin: z.coerce.number().optional().nullable(),
    budgetMax: z.coerce.number().optional().nullable(),
    bhk: z.coerce.string().optional().nullable().or(z.literal('')),
    propertyType: z.coerce.string().optional().nullable().or(z.literal('')),
    id: z.coerce.string().optional(),
    city: z.coerce.string().optional().nullable(),
    purpose: z.coerce.string().optional().nullable(),
    status: z.coerce.string().optional().nullable(),
    timeline: z.coerce.string().optional().nullable(),
    source: z.coerce.string().optional().nullable(),
    notes: z.coerce.string().optional().nullable(),
    tags: z.any().optional().nullable(),
}).refine(data => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMin !== null && data.budgetMax !== null) {
        const min = Number(data.budgetMin);
        const max = Number(data.budgetMax);
        return isNaN(min) || isNaN(max) || min <= max;
    }
    return true;
}, {
    message: 'Max budget must be greater than or equal to min budget.',
    path: ['budgetMax'],
}).refine(data => {
    if (data.propertyType === 'Apartment' || data.propertyType === 'Villa') {
        return !!data.bhk;
    }
    return true;
}, {
    message: 'BHK is required for Apartment and Villa property types.',
    path: ['bhk'],
});

export default function BuyerProfilePage({ params }: BuyerProfilePageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const buyerId = resolvedParams.id;

    const [formData, setFormData] = useState<Partial<BuyerProfileData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [history, setHistory] = useState<any[]>([]);

    const fetchBuyer = useCallback(async (id: string) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch buyer details.');
            }
            const data = await res.json();
            const profileData: BuyerProfileData = data.buyer || data;

            if (profileData.tags) {
                if (typeof profileData.tags === 'string') {
                    const tagsString = profileData.tags;
                    try {
                        let parsed = JSON.parse(tagsString);
                        if (Array.isArray(parsed) && parsed.every(Array.isArray)) parsed = parsed.flat();
                        profileData.tags = parsed.map(String).filter(Boolean);
                    } catch {
                        profileData.tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
                    }
                } else if (Array.isArray(profileData.tags)) {
                    profileData.tags = profileData.tags.flat().map(String).filter(Boolean);
                } else {
                    profileData.tags = [];
                }
            } else {
                profileData.tags = [];
            }

            const rawHistory = data.history || [];
            const parsedHistory = rawHistory.map((h: any) => {
                let diffData: any[] = [];

                if (typeof h.diff === 'string') {
                    try {
                        const parsed = JSON.parse(h.diff);
                        if (Array.isArray(parsed)) {
                            diffData = parsed;
                        }
                    } catch {
                        diffData = [];
                    }
                } else if (Array.isArray(h.diff)) {
                    diffData = h.diff;
                }

                return { ...h, diff: diffData };
            });

            const sortedHistory = parsedHistory
                .sort((a: any, b: any) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                .slice(0, 5);

            setHistory(sortedHistory);
            setFormData(profileData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (buyerId) fetchBuyer(buyerId);
    }, [buyerId, fetchBuyer]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'tags') {
            const tagsArray = value.split(',').map(tag => tag.trim()).filter(Boolean);
            setFormData(prev => ({ ...prev, tags: tagsArray }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        const validationResult = BuyerProfileSchema.safeParse(formData);
        if (!validationResult.success) {
            const issues = validationResult.error.issues;
            const errorMessages = issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
            setError(errorMessages);
            setIsSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to apply changes.');
            setSuccess('Profile updated successfully!');
            router.push('/buyers');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="loading-container">Loading Profile...</div>;

    return (
        <>
            <style>{`
  body { background-color: #f9fafb; font-family: sans-serif; }
  .form-container { max-width: 800px; margin: 2rem auto; padding: 2.5rem; background-color: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .form-header { margin-bottom: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; }
  .form-header h1 { font-size: 1.8rem; font-weight: 600; color: #1f2937; }
  .form-header p { color: #6b7280; margin-top: 0.5rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .form-field { display: flex; flex-direction: column; }
  .form-field.full-width { grid-column: 1 / -1; }
  .form-field label { margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.9rem; }
  .form-field input, .form-field select, .form-field textarea { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
  .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); outline: none; }
  .form-field textarea { min-height: 120px; resize: vertical; }
  .form-actions { margin-top: 2.5rem; display: flex; justify-content: flex-end; align-items: center; gap: 1rem; }
  .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s, opacity 0.2s; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary { background-color: #3b82f6; color: white; }
  .btn-primary:hover:not(:disabled) { background-color: #2563eb; }
  .btn-secondary { background-color: #e5e7eb; color: #374151; }
  .btn-secondary:hover:not(:disabled) { background-color: #d1d5db; }
  .loading-container, .error-container { text-align: center; padding: 4rem; font-size: 1.2rem; color: #6b7280; }
  .message { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; }
  .message.success { background-color: #dcfce7; color: #166534; }
  .message.error { background-color: #fee2e2; color: #991b1b; }

  /* --- HISTORY SECTION STYLING --- */
  .form-field.full-width ul li {
    color: #000; /* Black font for history diff */
    font-size: 0.95rem;
    line-height: 1.4rem;
  }
  .form-field.full-width div {
    color: #000; /* Black font for history labels */
  }
`}</style>


            <div className="form-container">
                <div className="form-header">
                    <h1>Edit Profile</h1>
                    <p>Update the details for {formData.fullName || '...'}</p>
                </div>

                {success && <div className="message success">{success}</div>}
                {error && <div className="message error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* FORM FIELDS */}
                        <div className="form-field">
                            <label htmlFor="fullName">Full Name</label>
                            <input id="fullName" name="fullName" type="text" value={formData.fullName || ''} onChange={handleInputChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="phone">Phone</label>
                            <input id="phone" name="phone" type="text" value={formData.phone || ''} onChange={handleInputChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="city">City</label>
                            <select id="city" name="city" value={formData.city || ''} onChange={handleInputChange}>
                                <option>Chandigarh</option><option>Mohali</option><option>Zirakpur</option><option>Panchkula</option><option>Other</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="propertyType">Property Type</label>
                            <select id="propertyType" name="propertyType" value={formData.propertyType || ''} onChange={handleInputChange}>
                                <option>Apartment</option><option>Villa</option><option>Plot</option><option>Office</option><option>Retail</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="bhk">BHK</label>
                            <select id="bhk" name="bhk" value={formData.bhk || ''} onChange={handleInputChange}>
                                <option value="">N/A</option><option>1</option><option>2</option><option>3</option><option>4</option><option>Studio</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="purpose">Purpose</label>
                            <select id="purpose" name="purpose" value={formData.purpose || ''} onChange={handleInputChange}>
                                <option>Buy</option><option>Rent</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="status">Status</label>
                            <select id="status" name="status" value={formData.status || ''} onChange={handleInputChange}>
                                <option>New</option><option>Qualified</option><option>Contacted</option><option>Visited</option><option>Negotiation</option><option>Converted</option><option>Dropped</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="budgetMin">Min Budget (INR)</label>
                            <input id="budgetMin" name="budgetMin" type="number" value={formData.budgetMin || ''} onChange={handleInputChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="budgetMax">Max Budget (INR)</label>
                            <input id="budgetMax" name="budgetMax" type="number" value={formData.budgetMax || ''} onChange={handleInputChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="timeline">Timeline</label>
                            <select id="timeline" name="timeline" value={formData.timeline || ''} onChange={handleInputChange}>
                                <option value="0-3m">0-3 Months</option><option value="3-6m">3-6 Months</option><option value=">6m">&gt;6 Months</option><option>Exploring</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="source">Source</label>
                            <select id="source" name="source" value={formData.source || ''} onChange={handleInputChange}>
                                <option>Website</option><option>Referral</option><option>Walk-in</option><option>Call</option><option>Other</option>
                            </select>
                        </div>
                        <div className="form-field full-width">
                            <label htmlFor="notes">Notes</label>
                            <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} />
                        </div>
                        <div className="form-field full-width">
                            <label htmlFor="tags">Tags (comma-separated)</label>
                            <input id="tags" name="tags" type="text" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => router.push('/buyers')} className="btn btn-secondary">Back to Dashboard</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Apply Changes'}</button>
                    </div>
                </form>

                {/* --- HISTORY SECTION --- */}
                {history.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem', color: '#1f2937' }}>Change History (Last 5)</h2>
                        {history.map((h, idx) => (
                            <div
                                key={idx}
                                className="form-field full-width"
                                style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}
                            >
                                <div><strong>Changed At:</strong> {new Date(h.changedAt).toLocaleString()}</div>
                                <div><strong>Diff:</strong>
                                    <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
                                        {h.diff.map((d: any, i: number) => {
                                            // Clean tags display
                                            const oldVal = Array.isArray(d.old) ? d.old.flat().map(String).join(', ') : d.old;
                                            const newVal = Array.isArray(d.new) ? d.new.flat().map(String).join(', ') : d.new;
                                            return <li key={i}>{d.field}: {oldVal} → {newVal}</li>;
                                        })}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </>
    );
}
