"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { NotificationRecipient } from "@/types/notification";

// // Point this at however your app already attaches the JWT - an auth context,
// // a cookie read, whatever you're using elsewhere. Centralizing it here means
// // every request in this hook updates automatically if that changes.
// function getAuthToken(): string | null {
//   return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
// }

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.supportnest.io/v1";

async function apiFetch(path: string, options: RequestInit = {}) {
  // const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<NotificationRecipient[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    const { count } = await apiFetch("/notifications/unread-count");
    setUnreadCount(count);
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiFetch("/notifications?limit=20");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
    await apiFetch("/notifications/read-all", { method: "PATCH" });
  }, []);

  // Initial load, once we have a user
  useEffect(() => {
    if (!userId || loadedOnce.current) return;
    loadedOnce.current = true;
    fetchUnreadCount();
    fetchList();
  }, [userId, fetchUnreadCount, fetchList]);

  // Realtime signal - content-free. The channel name must exactly match
  // what the backend broadcasts to: `user:{userId}:notifications`.
  useEffect(() => {
    if (!userId) return;
    const channel = supabaseBrowser
      .channel(`user:${userId}:notifications`)
      .on("broadcast", { event: "new" }, () => {
        fetchUnreadCount();
        fetchList();
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount, fetchList]);

  return {
    items,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchList,
  };
}
