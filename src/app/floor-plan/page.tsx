"use client";

import { useState, useRef, useEffect } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { Table } from "@/types";

export default function FloorPlan() {
  const { currentBranch, tables, users, updateTableStatus, assignServer, updateTablePosition, updateTableRotation, updateTable, mergeTables, splitTable, addTable, deleteTable, loading } = useRestaurant();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [composition, setComposition] = useState<Table[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // Fetch composition for combined table
  useEffect(() => {
    async function loadComposition() {
      const selected = tables.find(t => t.id === selectedTableId);
      if (selected?.isCombined && selected.mergedTableIds) {
        const res = await fetch('/api/tables/composition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableIds: selected.mergedTableIds })
        });
        if (res.ok) setComposition(await res.json());
      } else {
        setComposition([]);
      }
    }
    loadComposition();
  }, [selectedTableId, tables]);

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

  const handlePropertyChange = (field: keyof Table, value: any) => {
    if (selectedTableId) {
      updateTable(selectedTableId, { [field]: value });
    }
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedTableId) {
      updateTableRotation(selectedTableId, parseInt(e.target.value));
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
      shape: 'square',
      rotation: 0
    });
  };

  const handleDeleteTable = () => {
    if (selectedTableId && confirm("Are you sure you want to delete this table?")) {
      deleteTable(selectedTableId);
      setSelectedTableId(null);
    }
  };

  const handleMerge = () => {
    if (selectedTableIds.length < 2) {
      alert("Please select at least 2 tables to merge (hold Ctrl/Cmd to multi-select)");
      return;
    }
    mergeTables(selectedTableIds);
    setSelectedTableIds([]);
    setSelectedTableId(null);
  };

  const handleSplit = () => {
    if (selectedTableId) {
      splitTable(selectedTableId);
      setSelectedTableId(null);
    }
  };

  const handleTableClick = (e: React.MouseEvent, tableId: string) => {
    if (isEditMode) {
      if (e.ctrlKey || e.metaKey) {
        setSelectedTableIds(prev => 
          prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
        );
      } else {
        setSelectedTableId(tableId);
        setSelectedTableIds([tableId]);
      }
    } else {
      setSelectedTableId(tableId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode) return;
    setIsDragging(true);
    if (!selectedTableIds.includes(tableId)) {
       setSelectedTableId(tableId);
       setSelectedTableIds([tableId]);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedTableId || !floorPlanRef.current) return;

      const rect = floorPlanRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 40;
      const y = e.clientY - rect.top - 40;

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

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading floor plan...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Floor Plan</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isEditMode && (
            <>
              <button className="btn btn-outline" onClick={handleAddTable}>+ Add Table</button>
              <button className="btn btn-outline" onClick={handleMerge} disabled={selectedTableIds.length < 2}>Merge Selected</button>
            </>
          )}
          <button 
            className={`btn ${isEditMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedTableIds([]);
                setSelectedTableId(null);
            }}
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
            const isSelected = selectedTableId === table.id || selectedTableIds.includes(table.id);
            let bgClass = "status-badge available";
            if (table.status === 'occupied') bgClass = "status-badge occupied";
            if (table.status === 'reserved') bgClass = "status-badge reserved";
            if (table.status === 'cleaning') bgClass = "status-badge cleaning";
            if (table.status === 'combined') bgClass = "status-badge combined";

            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                onClick={(e) => handleTableClick(e, table.id)}
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
                  boxShadow: isSelected ? '0 0 0 4px var(--brand-accent)' : 'var(--shadow-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--border-color)',
                  transition: isDragging ? 'none' : 'all 0.2s',
                  userSelect: 'none',
                  zIndex: isSelected ? 10 : 1,
                                  transform: `rotate(${table.rotation || 0}deg)`
                                }}
                              >
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  transform: `rotate(${- (table.rotation || 0)}deg)`,
                                  width: '100%',
                                  height: '100%',
                                  pointerEvents: 'none'
                                }}>
                                                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{table.number}</div>
                                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cap: {table.capacity}</div>
                                                  
                                                  {table.assignedServerId && (
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--brand-primary)', marginTop: '0.125rem' }}>
                                                      Srv: {users.find(u => u.id === table.assignedServerId)?.name.split(' ')[0]}
                                                    </div>
                                                  )}
                                  
                                                  {!isEditMode && (                                    <div className={bgClass} style={{ marginTop: '0.25rem', fontSize: '0.65rem', padding: '0.125rem 0.375rem' }}>
                                      {table.status}
                                    </div>
                                  )}
                                </div>
                  
                                {isEditMode && isSelected && (
                                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--brand-primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', transform: `rotate(${- (table.rotation || 0)}deg)` }}>
                                    ✥
                                  </div>
                                )}
                              </div>            );
          })}
        </div>

        {/* Sidebar Controls */}
        <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h2 className="card-title">Table Controls</h2>
          
          {selectedTableId ? (() => {
            const table = tables.find(t => t.id === selectedTableId);
            if (!table) return null;
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {isEditMode ? (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Table Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ width: '100%' }} 
                        value={table.number} 
                        onChange={(e) => handlePropertyChange('number', e.target.value)} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Capacity</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '100%' }} 
                        value={table.capacity} 
                        onChange={(e) => handlePropertyChange('capacity', parseInt(e.target.value) || 0)} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Shape</label>
                      <select 
                        className="form-select" 
                        style={{ width: '100%' }} 
                        value={table.shape} 
                        onChange={(e) => handlePropertyChange('shape', e.target.value)}
                      >
                        <option value="square">Square</option>
                        <option value="circle">Circle</option>
                        <option value="rectangle">Rectangle</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        Rotation <span>{table.rotation || 0}°</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="315" 
                        step="45" 
                        value={table.rotation || 0} 
                        onChange={handleRotationChange}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Layout Actions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {table.isCombined && (
                          <>
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>COMPOSITION</div>
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                {composition.map(ct => (
                                  <span key={ct.id} style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                                    #{ct.number}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSplit}>
                              Split Table
                            </button>
                          </>
                        )}
                        <button className="btn btn-outline" style={{ width: '100%', color: 'var(--status-occupied)', borderColor: 'var(--status-occupied)' }} onClick={handleDeleteTable}>
                          Delete Table
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Table Info</label>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{table.number} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({table.capacity} seats)</span></div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Status</label>
                      <select className="form-select" style={{ width: '100%' }} value={table.status} onChange={handleStatusChange}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="occupied">Occupied</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="combined" disabled>Combined</option>
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
                    
                    {table.seatedAt && table.status === 'occupied' && (
                      <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Time Seated</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {Math.floor((Date.now() - new Date(table.seatedAt).getTime()) / 60000)} mins ago
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })() : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
              {isEditMode ? (
                <p>Select tables (Ctrl/Cmd + click) to Merge,<br/>or select one to Edit properties.</p>
              ) : (
                <p>Select a table on the floor plan to manage its status.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
