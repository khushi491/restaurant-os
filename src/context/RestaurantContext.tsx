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
  addReservation: (reservation: any) => Promise<void>;
  updateReservationStatus: (id: string, status: Reservation["status"]) => Promise<void>;
  addToWaitlist: (entry: any) => Promise<void>;
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

  const syncTable = async (table: any) => {
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("NETWORK ERROR:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tablesRes, resRes, waitRes] = await Promise.all([
          fetch(`/api/tables?branchId=${currentBranch.id}`),
          fetch(`/api/reservations?branchId=${currentBranch.id}`),
          fetch(`/api/waitlist?branchId=${currentBranch.id}`)
        ]);
        
        const [tablesData, resData, waitData] = await Promise.all([
          tablesRes.json(),
          resRes.json(),
          waitRes.json()
        ]);

        setTables(tablesData);
        setReservations(resData);
        setWaitlist(waitData);

        // Fetch guests separately if we had a guest API, but we'll use a static mock for now
        setGuests([
            { id: "g1", name: "Alice Johnson", phone: "555-0100", email: "alice@example.com", visitCount: 5, loyaltyStatus: "VIP", dietaryRestrictions: ["Gluten-Free"], notes: "Prefers window seat" },
            { id: "g2", name: "Bob Martin", phone: "555-0200", email: "bob@example.com", visitCount: 1, loyaltyStatus: "Standard", dietaryRestrictions: [], notes: "" },
        ]);

      } catch (err) {
        console.error("Failed to load restaurant data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentBranch.id]);

  const updateTableStatus = async (tableId: string, status: Table["status"]) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const updates: Partial<Table> = { status, seatedAt: status === 'occupied' ? new Date().toISOString() : table.seatedAt };
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
    await syncTable({ id: tableId, ...updates });
  };

  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, x, y } : t));
    await syncTable({ id: tableId, x, y });
  };

  const updateTableRotation = async (tableId: string, rotation: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, rotation } : t));
    await syncTable({ id: tableId, rotation });
  };

  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
    await syncTable({ id: tableId, ...updates });
  };

  const mergeTables = async (tableIds: string[]) => {
    const tablesToMerge = tables.filter(t => tableIds.includes(t.id));
    if (tablesToMerge.length < 2) return;
    const mainTable = tablesToMerge[0];
    const totalCapacity = tablesToMerge.reduce((sum, t) => sum + t.capacity, 0);
    const combinedNumber = tablesToMerge.map(t => t.number).sort().join("+");
    const combinedTable: any = { branchId: currentBranch.id, number: combinedNumber, capacity: totalCapacity, status: 'combined', shape: 'rectangle', x: mainTable.x, y: mainTable.y, isCombined: true, mergedTableIds: tableIds };
    const res = await fetch('/api/tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([combinedTable]) });
    if (res.ok) {
        const refreshRes = await fetch(`/api/tables?branchId=${currentBranch.id}`);
        setTables(await refreshRes.json());
    }
  };

  const splitTable = async (tableId: string) => {
    await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
    const refreshRes = await fetch(`/api/tables?branchId=${currentBranch.id}`);
    setTables(await refreshRes.json());
  };

  const addTable = async (tableData: Omit<Table, "id">) => {
    const res = await fetch('/api/tables', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(tableData) 
    });
    const data = await res.json();
    if (res.ok) {
      setTables(prev => [...prev, data]);
    } else {
      console.error("ADD TABLE ERROR:", data);
    }
  };

  const deleteTable = async (tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
    await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
  };

  const assignServer = async (tableId: string, serverId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, assignedServerId: serverId } : t));
    await syncTable({ id: tableId, assignedServerId: serverId });
  };

  const addReservation = async (resData: any) => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...resData, branchId: currentBranch.id })
    });
    const data = await res.json();
    if (res.ok) setReservations(prev => [...prev, data]);
  };

  const updateReservationStatus = async (id: string, status: Reservation["status"]) => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    if (res.ok) setReservations(prev => prev.map(r => r.id === id ? data : r));
  };

  const addToWaitlist = async (entryData: any) => {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entryData, branchId: currentBranch.id })
    });
    const data = await res.json();
    if (res.ok) setWaitlist(prev => [...prev, data]);
  };

  return (
    <RestaurantContext.Provider value={{
      currentUser, currentBranch, branches, tables, guests, reservations, waitlist, users, loading,
      setCurrentBranch, updateTableStatus, updateTablePosition, updateTableRotation, updateTable, mergeTables, splitTable, addTable, deleteTable, assignServer,
      addReservation, updateReservationStatus, addToWaitlist
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
