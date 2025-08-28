"use client";

import { setCookie, getCookie } from "cookies-next";
import React, { createContext, useCallback, useEffect, useState, useContext } from "react";
import { AttributeItem } from "@/lib/types";

export type UserSettings = {
  theme_color: string;
  chat: boolean;
  inputs: { camera: boolean; screen: boolean; mic: boolean };
  outputs: { audio: boolean; video: boolean };
  ws_url: string;
  token: string;
  room_name: string;
  participant_id: string;
  participant_name: string;
  agent_name?: string;
  metadata?: string;
  attributes?: AttributeItem[];
};

const defaultSettings: UserSettings = {
  theme_color: "sky",
  chat: true,
  inputs: { camera: true, screen: true, mic: true },
  outputs: { audio: true, video: true },
  ws_url: process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
  token: "",
  room_name: "",
  participant_id: "",
  participant_name: "",
  agent_name: "Interactive Avatar-v0.0", // <-- THE CHANGE IS HERE
  metadata: "",
  attributes: [],
};

type ConfigData = {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
};

const ConfigContext = createContext<ConfigData | undefined>(undefined);

export const LiveKitConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const getSettingsFromCookies = useCallback((): UserSettings | null => {
    const jsonSettings = getCookie("lk_agent_settings");
    if (!jsonSettings || typeof jsonSettings !== 'string') return null;
    try {
      // Merge with default settings to ensure new fields are present
      const savedSettings = JSON.parse(jsonSettings) as Partial<UserSettings>;
      return { ...defaultSettings, ...savedSettings };
    } catch (e) {
      return null;
    }
  }, []);

  const setCookieSettings = useCallback((us: UserSettings) => {
    const json = JSON.stringify(us);
    setCookie("lk_agent_settings", json);
  }, []);
  
  const [settings, _setSettings] = useState<UserSettings>(() => getSettingsFromCookies() || defaultSettings);
  
  const setSettings = useCallback((newSettings: UserSettings) => {
      setCookieSettings(newSettings);
      _setSettings(newSettings);
    }, [setCookieSettings]
  );

  useEffect(() => {
    const cookieSettings = getSettingsFromCookies();
    if (cookieSettings) {
      _setSettings(cookieSettings);
    }
  }, [getSettingsFromCookies]);

  return (
    <ConfigContext.Provider value={{ settings, setSettings }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useLiveKitConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useLiveKitConfig must be used within a LiveKitConfigProvider");
  }
  return context;
};