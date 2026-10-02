"use client";

import { useEffect, useRef } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Row = Record<string, unknown>;
type Handler<T> = (row: T) => void;

/**
 * Subscribe to Supabase Realtime changes on a table.
 *
 * Callbacks are held in a ref so that passing an inline arrow function
 * (the common case) does not tear down and recreate the channel on every
 * render. Only `table` and `filter` change the subscription.
 *
 * Note: Supabase does not apply RLS as a server-side channel filter, so
 * row-level visibility is left to the row security policies.
 */
export function useRealtime<T extends Row = Row>(
  table: string,
  filter: string | null,
  onInsert?: Handler<T>,
  onUpdate?: Handler<T>,
  onDelete?: Handler<T>
): void {
  const handlers = useRef({ onInsert, onUpdate, onDelete });

  // Refresh the stored callbacks in an effect rather than during render, so
  // an inline arrow function does not tear down and recreate the channel.
  useEffect(() => {
    handlers.current = { onInsert, onUpdate, onDelete };
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    const channel: RealtimeChannel = supabase.channel(
      filter ? `realtime:${table}:${filter}` : `realtime:${table}`
    );

    const eventFilter = { schema: "public", table, ...(filter ? { filter } : {}) };

    if (onInsert) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          ...eventFilter,
        } satisfies RealtimePostgresChangesFilter<"INSERT">,
        (payload: RealtimePostgresInsertPayload<T>) => {
          if (payload.new) handlers.current.onInsert?.(payload.new);
        }
      );
    }

    if (onUpdate) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          ...eventFilter,
        } satisfies RealtimePostgresChangesFilter<"UPDATE">,
        (payload: RealtimePostgresUpdatePayload<T>) => {
          if (payload.new) handlers.current.onUpdate?.(payload.new);
        }
      );
    }

    if (onDelete) {
      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          ...eventFilter,
        } satisfies RealtimePostgresChangesFilter<"DELETE">,
        (payload: RealtimePostgresDeletePayload<T>) => {
          // Supabase types DELETE `old` as Partial<T> because it only
          // returns primary key columns for replica identity.
          if (payload.old) handlers.current.onDelete?.(payload.old as T);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn(`Realtime channel error for ${table}`);
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
    // onInsert/onUpdate/onDelete are deliberately excluded: they are read via
    // `handlers` at call time, so a new inline callback must not resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}