"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { NotificationRecipient } from "@/types/notification";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// Your backend reads the JWT from the "accessToken" cookie, not a header -
// so credentials: "include" is what actually authenticates this request.
// No Authorization header needed here at all.
async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
        n.id === id
          ? {
              ...n,
              readAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
    await apiFetch("/notifications/read-all", { method: "PATCH" });
  }, []);

  useEffect(() => {
    if (!userId || loadedOnce.current) return;
    loadedOnce.current = true;
    fetchUnreadCount();
    fetchList();
  }, [userId, fetchUnreadCount, fetchList]);

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
