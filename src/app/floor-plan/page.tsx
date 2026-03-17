"use client";

import { useState, useRef, useEffect } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { Table } from "@/types";

export default function FloorPlan() {
  const { currentBranch, tables, users, updateTableStatus, assignServer, updateTablePosition, addTable, deleteTable } = useRestaurant();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  const branchTables = tables.filter(t => t.branchId === currentBranch.id);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (selectedTableId) {
      updateTableStatus(selectedTableId, e.target.value as any);
    }
  };

  const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (selectedTableId) {
      assignServer(selectedTableId, e.target.value);
    }
  };

  const handleAddTable = () => {
    const tableNumber = prompt("Enter Table Number:");
    if (!tableNumber) return;
    
    addTable({
      branchId: currentBranch.id,
      number: tableNumber,
      capacity: 4,
      status: 'available',
      x: 50,
      y: 50,
      shape: 'square'
    });
  };

  const handleDeleteTable = () => {
    if (selectedTableId && confirm("Are you sure you want to delete this table?")) {
      deleteTable(selectedTableId);
      setSelectedTableId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode) return;
    setSelectedTableId(tableId);
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedTableId || !floorPlanRef.current) return;

      const rect = floorPlanRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 40; // Subtract half-width (approx 40px)
      const y = e.clientY - rect.top - 40; // Subtract half-height (approx 40px)

      // Snap to grid (optional)
      const snapX = Math.round(x / 10) * 10;
      const snapY = Math.round(y / 10) * 10;

      updateTablePosition(selectedTableId, snapX, snapY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedTableId, updateTablePosition]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Floor Plan</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isEditMode && (
            <button className="btn btn-outline" onClick={handleAddTable}>+ Add Table</button>
          )}
          <button 
            className={`btn ${isEditMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Save Layout' : 'Modify Floor Plan'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Floor Plan View */}
        <div 
          ref={floorPlanRef}
          className="card" 
          style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden', 
            background: '#e2e8f0',
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {branchTables.map(table => {
            let bgClass = "status-badge available";
            if (table.status === 'occupied') bgClass = "status-badge occupied";
            if (table.status === 'reserved') bgClass = "status-badge reserved";
            if (table.status === 'cleaning') bgClass = "status-badge cleaning";

            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                onClick={() => !isEditMode && setSelectedTableId(table.id)}
                style={{
                  position: 'absolute',
                  left: table.x,
                  top: table.y,
                  width: table.shape === 'rectangle' ? '120px' : '80px',
                  height: '80px',
                  borderRadius: table.shape === 'circle' ? '50%' : 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isEditMode ? 'move' : 'pointer',
                  boxShadow: selectedTableId === table.id ? '0 0 0 4px var(--brand-accent)' : 'var(--shadow-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--border-color)',
                  transition: isDragging ? 'none' : 'all 0.2s',
                  userSelect: 'none',
                  zIndex: selectedTableId === table.id ? 10 : 1
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{table.number}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cap: {table.capacity}</div>
                {!isEditMode && (
                  <div className={bgClass} style={{ marginTop: '0.25rem', fontSize: '0.65rem', padding: '0.125rem 0.375rem' }}>
                    {table.status}
                  </div>
                )}
                {isEditMode && selectedTableId === table.id && (
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--brand-primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                    ✥
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Controls */}
        <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title">Table Controls</h2>
          
          {selectedTableId ? (() => {
            const table = tables.find(t => t.id === selectedTableId);
            if (!table) return null;
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Table Number</label>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{table.number} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({table.capacity} seats)</span></div>
                </div>

                {!isEditMode && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Status</label>
                      <select className="form-select" style={{ width: '100%' }} value={table.status} onChange={handleStatusChange}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="occupied">Occupied</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="combined">Combined</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Assigned Server</label>
                      <select className="form-select" style={{ width: '100%' }} value={table.assignedServerId || ""} onChange={handleServerChange}>
                        <option value="">Unassigned</option>
                        {users.filter(u => u.branchIds.includes(currentBranch.id) && u.role === 'Server').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {isEditMode && (
                  <>
                    <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Table Properties</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem' }}>X: {table.x}, Y: {table.y}</div>
                        <button className="btn btn-outline" style={{ width: '100%', color: 'var(--status-occupied)', borderColor: 'var(--status-occupied)' }} onClick={handleDeleteTable}>
                          Delete Table
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {table.seatedAt && table.status === 'occupied' && !isEditMode && (
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Time Seated</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {Math.floor((Date.now() - new Date(table.seatedAt).getTime()) / 60000)} mins ago
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
              Select a table on the floor plan to manage its {isEditMode ? 'layout' : 'status'}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
