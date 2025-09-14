'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

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
  budgetMin?: number | string | 0;
  budgetMax?: number | string | 0;
  timeline?: string | null;
  source?: string | null;
  notes?: string | null;
  tags?: string[] | string | null;
  password?: string | null;
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
  if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMin !== null && data.budgetMax !== null && data.budgetMin !== undefined && data.budgetMax !== undefined) {
    const min = Number(data.budgetMin);
    const max = Number(data.budgetMax);
    return min <= max;
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

export default function BuyerProfilePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<BuyerProfileData>>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    city: 'Chandigarh',
    propertyType: 'Apartment',
    bhk: '',
    purpose: 'Buy',
    status: 'New',
    budgetMin: '',
    budgetMax: '',
    timeline: '0-3m',
    source: 'Website',
    notes: '',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'tags') {
      const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
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

    // Client-side validation with Zod
    const validationResult = BuyerProfileSchema.safeParse(formData);
    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      const errorMessages = issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      setError(errorMessages);
      setIsSaving(false);
      return;
    }

    try {
      const email = (formData.email ?? '').toString();

      if (email) {
        const check = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!check.ok) {
          router.push('/');
          return;
        }
      }

      const res = await fetch('/api/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || 'Failed to create buyer.');
      }

      setSuccess(result?.message || 'Buyer created successfully.');
      setTimeout(() => setSuccess(''), 3000);
      router.push('/buyers');
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading Profile...</div>;
  }

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
        .form-field input, .form-field select, .form-field textarea {
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
            font-family: inherit;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            outline: none;
        }
        .form-field textarea { min-height: 120px; resize: vertical; }

        .form-actions { margin-top: 2.5rem; display: flex; justify-content: flex-end; align-items: center; gap: 1rem; }
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, opacity 0.2s;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background-color: #3b82f6; color: white; }
        .btn-primary:hover:not(:disabled) { background-color: #2563eb; }
        .btn-secondary { background-color: #e5e7eb; color: #374151; }
        .btn-secondary:hover:not(:disabled) { background-color: #d1d5db; }

        .loading-container { text-align: center; padding: 4rem; font-size: 1.2rem; color: #6b7280; }
        .message { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; }
        .message.success { background-color: #dcfce7; color: #166534; }
        .message.error { background-color: #fee2e2; color: #991b1b; }

        @media (max-width: 768px) {
            .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="form-container">
        <div className="form-header">
          <h1>Create Buyer</h1>
          <p>Enter buyer details to create a new buyer.</p>
        </div>

        {success && <div className="message success">{success}</div>}
        {error && <div className="message error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" type="text" required value={formData.fullName ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required value={formData.email ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required value={formData.password ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="text" value={formData.phone ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field">
              <label htmlFor="city">City</label>
              <select id="city" name="city" value={formData.city ?? 'Chandigarh'} onChange={handleInputChange}>
                <option>Chandigarh</option><option>Mohali</option><option>Zirakpur</option><option>Panchkula</option><option>Other</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="propertyType">Property Type</label>
              <select id="propertyType" name="propertyType" value={formData.propertyType ?? 'Apartment'} onChange={handleInputChange}>
                <option>Apartment</option><option>Villa</option><option>Plot</option><option>Office</option><option>Retail</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="bhk">BHK</label>
              <select id="bhk" name="bhk" value={formData.bhk ?? ''} onChange={handleInputChange}>
                <option value="">N/A</option><option>1</option><option>2</option><option>3</option><option>4</option><option>Studio</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="purpose">Purpose</label>
              <select id="purpose" name="purpose" value={formData.purpose ?? 'Buy'} onChange={handleInputChange}>
                <option>Buy</option><option>Rent</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={formData.status ?? 'New'} onChange={handleInputChange}>
                <option>New</option><option>Qualified</option><option>Contacted</option><option>Visited</option><option>Negotiation</option><option>Converted</option><option>Dropped</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="budgetMin">Min Budget (INR)</label>
              <input id="budgetMin" name="budgetMin" type="number" required value={formData.budgetMin ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field">
              <label htmlFor="budgetMax">Max Budget (INR)</label>
              <input id="budgetMax" name="budgetMax" type="number" required value={formData.budgetMax ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field">
              <label htmlFor="timeline">Timeline</label>
              <select id="timeline" name="timeline" value={formData.timeline ?? '0-3m'} onChange={handleInputChange}>
                <option value="0-3m">0-3 Months</option><option value="3-6m">3-6 Months</option><option value=">6m">&gt;6 Months</option><option>Exploring</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="source">Source</label>
              <select id="source" name="source" value={formData.source ?? 'Website'} onChange={handleInputChange}>
                <option>Website</option><option>Referral</option><option>Walk-in</option><option>Call</option><option>Other</option>
              </select>
            </div>
            <div className="form-field full-width">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" value={formData.notes ?? ''} onChange={handleInputChange} />
            </div>
            <div className="form-field full-width">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input id="tags" name="tags" type="text" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags ?? '')} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => router.push('/buyers')} className="btn btn-secondary">
              Back to Dashboard
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Buyer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
