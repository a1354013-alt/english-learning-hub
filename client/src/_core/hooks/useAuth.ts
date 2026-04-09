import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

const STORAGE_KEY = "manus-runtime-user-info";

type StoredUser = {
  id?: number;
  name?: string | null;
  email?: string | null;
} | null;

export function getStoredUserSnapshot(storageLike: Pick<Storage, "getItem"> | null): StoredUser {
  if (!storageLike) return null;
  const raw = storageLike.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function persistUserSnapshot(
  storageLike: Pick<Storage, "setItem"> | null,
  user: unknown
): void {
  if (!storageLike) return;
  try {
    storageLike.setItem(STORAGE_KEY, JSON.stringify(user ?? null));
  } catch {
    // Ignore storage write errors in restricted browser modes.
  }
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const [storedUserSnapshot, setStoredUserSnapshot] = useState<StoredUser>(null);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const user = meQuery.data ?? (meQuery.isLoading ? storedUserSnapshot : null);
    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    storedUserSnapshot,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStoredUserSnapshot(getStoredUserSnapshot(window.localStorage));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistUserSnapshot(window.localStorage, meQuery.data ?? null);
    setStoredUserSnapshot(meQuery.data ?? null);
  }, [meQuery.data]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
