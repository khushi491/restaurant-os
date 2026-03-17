"use client";

import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";

export default function Waitlist() {
  const { currentBranch, waitlist, guests, addToWaitlist, loading } = useRestaurant();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestId: "g1",
    partySize: 2,
    quotedWaitTimeMins: 30,
    notes: ""
  });

  const branchWaitlist = waitlist.filter(w => w.branchId === currentBranch.id && w.status === 'waiting');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addToWaitlist(formData);
    setIsFormOpen(false);
  };

  if (loading) return <div>Loading waitlist...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Waitlist</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Close Form' : 'Add to Waitlist'}
        </button>
      </div>

      {isFormOpen && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 className="card-title">Add Guest to Waitlist</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Guest</label>
              <select className="form-select" style={{ width: '100%' }} value={formData.guestId} onChange={e => setFormData({ ...formData, guestId: e.target.value })}>
                {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Party Size</label>
              <input type="number" className="form-input" style={{ width: '100%' }} value={formData.partySize} onChange={e => setFormData({ ...formData, partySize: parseInt(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Quoted Wait (Mins)</label>
              <input type="number" className="form-input" style={{ width: '100%' }} value={formData.quotedWaitTimeMins} onChange={e => setFormData({ ...formData, quotedWaitTimeMins: parseInt(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Notes</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Need window seat, baby chair, etc." />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Add Guest</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Guest</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Party Size</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quoted Time</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Joined At</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branchWaitlist.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No guests on the waitlist.</td>
              </tr>
            ) : branchWaitlist.map(entry => {
              const guest = guests.find(g => g.id === entry.guestId);
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{guest?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{guest?.phone}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{entry.partySize}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--status-reserved)' }}>{entry.quotedWaitTimeMins} mins</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {entry.notes || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }}>Seat</button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--status-occupied)' }}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
