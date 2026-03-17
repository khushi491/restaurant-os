"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Branch,
  User,
  Table,
  Guest,
  Reservation,
  WaitlistEntry,
} from "../types";

// Keep static users/branches for now as they are higher-level settings
const mockBranches: Branch[] = [
  { id: "b1", name: "Downtown Prime", address: "123 Main St", cancellationFeeFixed: 50, cancellationFeePercent: null },
  { id: "b2", name: "Uptown Grill", address: "456 High St", cancellationFeeFixed: null, cancellationFeePercent: 10 },
];

const mockUsers: User[] = [
  { id: "u1", name: "Sarah Connor (Manager)", role: "Manager", branchIds: ["b1", "b2"] },
  { id: "u2", name: "John Smith (Host)", role: "Host", branchIds: ["b1"] },
  { id: "u3", name: "Emily Davis (Server)", role: "Server", branchIds: ["b1"] },
];

interface RestaurantState {
  currentUser: User;
  currentBranch: Branch;
  branches: Branch[];
  tables: Table[];
  guests: Guest[];
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  users: User[];
  loading: boolean;
  setCurrentBranch: (branch: Branch) => void;
  updateTableStatus: (tableId: string, status: Table["status"]) => void;
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  updateTableRotation: (tableId: string, rotation: number) => void;
  updateTable: (tableId: string, updates: Partial<Table>) => void;
  mergeTables: (tableIds: string[]) => void;
  splitTable: (tableId: string) => void;
  addTable: (table: Omit<Table, "id">) => void;
  deleteTable: (tableId: string) => void;
  assignServer: (tableId: string, serverId: string) => void;
  addReservation: (reservation: Omit<Reservation, "id" | "createdAt" | "status">) => void;
  updateReservationStatus: (id: string, status: Reservation["status"]) => void;
}

const RestaurantContext = createContext<RestaurantState | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [branches] = useState<Branch[]>(mockBranches);
  const [users] = useState<User[]>(mockUsers);
  const [currentUser] = useState<User>(mockUsers[0]);
  const [currentBranch, setCurrentBranch] = useState<Branch>(mockBranches[0]);
  const [loading, setLoading] = useState(true);
  
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  // Fetch tables from DB on branch change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tables?branchId=${currentBranch.id}`);
        const data = await res.json();
        setTables(data);
      } catch (err) {
        console.error("Failed to load tables", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentBranch.id]);

  const updateTableStatus = async (tableId: string, status: Table["status"]) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updates: Partial<Table> = { 
        status, 
        seatedAt: status === 'occupied' ? new Date().toISOString() : table.seatedAt 
    };

    setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
    await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ id: tableId, ...updates })
    });
  };

  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, x, y } : t));
    await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ id: tableId, x, y })
    });
  };

  const updateTableRotation = async (tableId: string, rotation: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, rotation } : t));
    await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ id: tableId, rotation })
    });
  };

  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
    await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ id: tableId, ...updates })
    });
  };

  const mergeTables = async (tableIds: string[]) => {
    const tablesToMerge = tables.filter(t => tableIds.includes(t.id));
    if (tablesToMerge.length < 2) return;

    const mainTable = tablesToMerge[0];
    const totalCapacity = tablesToMerge.reduce((sum, t) => sum + t.capacity, 0);
    const combinedNumber = tablesToMerge.map(t => t.number).sort().join("+");

    const combinedTable: any = {
      branchId: currentBranch.id,
      number: combinedNumber,
      capacity: totalCapacity,
      status: 'combined',
      shape: 'rectangle',
      x: mainTable.x,
      y: mainTable.y,
      isCombined: true,
      mergedTableIds: tableIds
    };

    // Use transaction to delete parts and add combined
    const res = await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify([combinedTable]) // Need to update route logic for deletes or just mark status
    });
    const result = await res.json();
    
    // For prototype simplicity, refresh all tables from DB
    const refreshRes = await fetch(`/api/tables?branchId=${currentBranch.id}`);
    const data = await refreshRes.json();
    setTables(data);
  };

  const splitTable = async (tableId: string) => {
    const combinedTable = tables.find(t => t.id === tableId);
    if (!combinedTable || !combinedTable.mergedTableIds) return;

    // For simplicity: delete combined and recreate parts or just reload
    await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
    
    // In a real app, restore originals. Here we just re-seed if empty or reload
    const refreshRes = await fetch(`/api/tables?branchId=${currentBranch.id}`);
    const data = await refreshRes.json();
    setTables(data);
  };

  const addTable = async (tableData: Omit<Table, "id">) => {
    const res = await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
    const newTable = await res.json();
    setTables(prev => [...prev, newTable]);
  };

  const deleteTable = async (tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
    await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
  };

  const assignServer = async (tableId: string, serverId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, assignedServerId: serverId } : t));
    await fetch('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ id: tableId, assignedServerId: serverId })
    });
  };

  const addReservation = (resData: Omit<Reservation, "id" | "createdAt" | "status">) => {
    // Keep mock for now
    const newRes: Reservation = {
      ...resData,
      id: `r${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "upcoming"
    };
    setReservations([...reservations, newRes]);
  };

  const updateReservationStatus = (id: string, status: Reservation["status"]) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <RestaurantContext.Provider value={{
      currentUser,
      currentBranch,
      branches,
      tables,
      guests,
      reservations,
      waitlist,
      users,
      loading,
      setCurrentBranch,
      updateTableStatus,
      updateTablePosition,
      updateTableRotation,
      updateTable,
      mergeTables,
      splitTable,
      addTable,
      deleteTable,
      assignServer,
      addReservation,
      updateReservationStatus
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error("useRestaurant must be used within RestaurantProvider");
  return context;
};
