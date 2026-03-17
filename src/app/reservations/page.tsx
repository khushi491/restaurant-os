"use client";

import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { ReservationStatus } from "@/types";

export default function Reservations() {
  const { currentBranch, reservations, guests, addReservation, updateReservationStatus, loading } = useRestaurant();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestId: "g1",
    partySize: 2,
    date: new Date().toISOString().split('T')[0],
    time: "19:00",
    notes: ""
  });

  const branchReservations = reservations.filter(r => r.branchId === currentBranch.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addReservation(formData);
    setIsFormOpen(false);
  };

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    await updateReservationStatus(id, status);
  };

  if (loading) return <div>Loading reservations...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Reservations</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Close Form' : 'New Reservation'}
        </button>
      </div>

      {isFormOpen && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 className="card-title">Book a Table</h2>
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
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Date</label>
              <input type="date" className="form-input" style={{ width: '100%' }} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Time</label>
              <input type="time" className="form-input" style={{ width: '100%' }} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Special Notes</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Anniversary, allergies, etc." />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Create Booking</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Guest</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date & Time</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Party</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branchReservations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No reservations found.</td>
              </tr>
            ) : branchReservations.map(res => {
              const guest = guests.find(g => g.id === res.guestId);
              return (
                <tr key={res.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{guest?.name || 'Unknown Guest'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{guest?.phone}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{res.date}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{res.time}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{res.partySize}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      className="form-select" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                      value={res.status}
                      onChange={(e) => handleStatusChange(res.id, e.target.value as ReservationStatus)}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="seated">Seated</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {res.notes || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
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
