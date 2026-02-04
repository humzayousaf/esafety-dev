import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import React from "react";


// --- Fetch all departments ---
export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/meta/departments?per_page=all");
      return data?.data ?? [];
    },
  });
};

// --- Fetch designations by department ---
export const useDesignations = (departmentId: number | null) => {
  return useQuery({
    queryKey: ["designations", departmentId],
    queryFn: async () => {
      if (!departmentId) return [];
      const { data } = await api.get(`/api/v1/meta/related?department_id=${departmentId}`);
      return data?.lists?.designations ?? [];
    },
    enabled: !!departmentId,
  });
};

export type Role = {
  id: number;
  name: string;
  guard_name: string;
  permissions_count: number;
  created_at: string;
  updated_at: string;
};

// --- Fetcher function
async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get("/api/v1/admin/roles",{params: {per_page: "all"}});
  return Array.isArray(data) ? data : data.data ?? []; // handle different API structures
}

// --- Hook
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });
}

export async function fetchUserById(id: number) {
  const { data } = await api.get(`/api/v1/users/${id}`);
  return data?.data;
}

export function useUser(userId?: number) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null; // no fetch if not editing
      const { data } = await api.get(`/api/v1/users/${userId}`);
      // Some Laravel APIs wrap user inside { data: {...} }
      return data?.data ?? data;
    },
    enabled: !!userId, // only run when editing
  });
}


export type OrgUserRow = {
  id: number;
  sap_code: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  status: "Active" | "Inactive";
  updatedAt: string; // ISO string
};

/** API -> UI row mapper */
function toRow(u: any): OrgUserRow {
  return {
    id: u.id,
    sap_code: u.sap_code,
    name: u.name ?? "—",
    email: u.email ?? "—",
    phone: u.phone ?? "—",
    designation: u.designation_name ?? u.designation?.name ?? "—",
    role: (u.roles?.[0]?.name as string) ?? "—",
    status: u.is_active ? "Active" : "Inactive",
    updatedAt: u.updated_at ?? u.created_at ?? new Date().toISOString(),
  };
}

/** Fetcher (kept separate for testability) */
async function fetchUsers(params: {
  page: number;
  perPage: number;
  search: string;
}) {
  const { page, perPage, search } = params;

  const { data } = await api.get("/api/v1/users", {
    params: {
      page,
      per_page: perPage,
      // backend expects `search=...` (as per your note)
      // if your backend uses `q` instead, just swap the key
      search: search || undefined,
    },
  });

  // Expecting shape: { data: User[], meta: { total, per_page, current_page, ... } }
  const rows: OrgUserRow[] = (data?.data ?? []).map(toRow);
  const total: number = data?.total ?? rows.length;

  return { rows, meta: { total } };
}

/** Main hook */
export function useUsers(page: number, perPage: number, search: string) {
  return useQuery({
    queryKey: ["users", { page, perPage, search }],
    queryFn: () => fetchUsers({ page, perPage, search }),
  });
}

/** Tiny debounce hook for search */
export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export interface User {
  id: number;
  name: string;
  gender: string;
  cnic?: string;
  phone?: string;
  email?: string;
  sap_code: string;
  date_of_birth: string | null;
  date_of_joining: string | null;
  is_active: number | boolean;

  avatar_url?: string | null;
  department_name?: string | null;
  designation_name?: string | null;

  department?: { id: number; name: string } | null;
  designation?: { id: number; name: string } | null;

  created_at: string;
  updated_at: string;
  last_login_at?: string | null;

  roles: { id: number; name: string }[];
}
export interface UserResponse {
  data: User;
  editable_fields_all: string[];
  note: string;
}


export async function getUser(id: number): Promise<UserResponse> {
  const { data } = await api.get(`/api/v1/users/${id}`);
  return data;
}


export function usePostingHistory(userId: number) {
  return useQuery({
    queryKey: ["posting-history", userId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/meta/users/${userId}/posting-history`);
      return data?.history ?? [];
    },
  });
}