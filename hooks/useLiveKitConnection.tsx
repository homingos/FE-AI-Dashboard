"use client";

import React, { createContext, useState, useCallback } from "react";
import { useLiveKitConfig } from "./useLiveKitConfig";
import { useToast } from "@/components/ui/use-toast";

export type ConnectionMode = "manual" | "env";

type ConnectionData = {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  mode: ConnectionMode;
  disconnect: () => Promise<void>;
  connect: (mode: ConnectionMode) => Promise<void>;
};

const ConnectionContext = createContext<ConnectionData | undefined>(undefined);

export const LiveKitConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { settings } = useLiveKitConfig();
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    mode: ConnectionMode;
    shouldConnect: boolean;
  }>({ wsUrl: "", token: "", shouldConnect: false, mode: "env" });

  const connect = useCallback(
    async (mode: ConnectionMode) => {
      let token = "";
      let url = "";
      if (mode === "env") {
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) {
            toast({ title: "Configuration Error", description: "NEXT_PUBLIC_LIVEKIT_URL is not set in your environment.", variant: "destructive" });
            return;
        }
        url = livekitUrl;
        
        const body: Record<string, any> = {};
        if (settings.room_name) body.roomName = settings.room_name;
        if (settings.participant_id) body.participantId = settings.participant_id;
        if (settings.participant_name) body.participantName = settings.participant_name;
        if (settings.metadata) body.metadata = settings.metadata;
        if (settings.agent_name) body.agentName = settings.agent_name;

        const attributesArray = Array.isArray(settings.attributes) ? settings.attributes : [];
        if (attributesArray?.length > 0) {
          const attributes = attributesArray.reduce((acc, attr) => {
            if (attr.key) acc[attr.key] = attr.value;
            return acc;
          }, {} as Record<string, string>);
          body.attributes = attributes;
        }

        try {
          const res = await fetch(`/api/livekit-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch token from server.");
          }
          const { accessToken } = await res.json();
          token = accessToken;
        } catch (e: any) {
          toast({ title: "Error", description: `Failed to get token: ${e.message}`, variant: "destructive" });
          return;
        }

      } else { // manual mode
        token = settings.token;
        url = settings.ws_url;
      }
      setConnectionDetails({ wsUrl: url, token, shouldConnect: true, mode });
    },
    [settings, toast]
  );

  const disconnect = useCallback(async () => {
    setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        mode: connectionDetails.mode,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useLiveKitConnection = () => {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useLiveKitConnection must be used within a ConnectionProvider");
  }
  return context;
};