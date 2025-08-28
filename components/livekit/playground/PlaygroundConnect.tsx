"use client";

import { useState } from "react";
import { useLiveKitConfig } from "@/hooks/useLiveKitConfig";
import { ConnectionMode } from "@/hooks/useLiveKitConnection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PlaygroundConnectProps = {
  accentColor: string;
  onConnectClicked: (mode: ConnectionMode) => void;
};

const TokenConnect = ({ accentColor, onConnectClicked }: PlaygroundConnectProps) => {
  const { setSettings, settings } = useLiveKitConfig();
  const [url, setUrl] = useState(settings.ws_url);
  const [token, setToken] = useState(settings.token);

  return (
    <div className="flex flex-col gap-4 pt-4 text-white w-full border-t border-gray-700">
        <div className="flex flex-col gap-4">
            <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={cn("text-white text-sm bg-gray-900 border-gray-700 focus:border-sky-500")}
                placeholder="wss://your-livekit-url"
            />
            <Textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={cn("text-white text-sm bg-gray-900 border-gray-700 focus:border-sky-500 h-32")}
                placeholder="Enter room token..."
            />
        </div>
        <Button
          className={cn("w-full bg-gradient-to-r hover:opacity-90", `from-${accentColor}-500 to-indigo-600`)}
          onClick={() => {
            const newSettings = { ...settings };
            newSettings.ws_url = url;
            newSettings.token = token;
            setSettings(newSettings);
            onConnectClicked("manual");
          }}
        >
          Connect Manually
        </Button>
    </div>
  );
};

export const PlaygroundConnect = ({ accentColor, onConnectClicked }: PlaygroundConnectProps) => {
  return (
    <div className="flex w-full h-full items-center justify-center text-center">
        <Card className="bg-gray-950/60 w-full max-w-[480px] text-white border-sky-500/30 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    Connect to Real-time Agent
                </CardTitle>
                <CardDescription className="text-gray-400 pt-2">
                    Connect to the playground with a URL and token, or launch with one click using your local environment variables.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center gap-4">
                    <Button
                        className={cn("w-full py-6 text-base bg-gradient-to-r", `from-${accentColor}-500 to-indigo-600`)}
                        onClick={() => onConnectClicked("env")}
                    >
                        Connect with Environment Keys
                    </Button>
                    <div className="text-sm text-gray-500">or</div>
                    <details className="w-full text-left">
                        <summary className="cursor-pointer text-sky-400 hover:underline list-none">
                            Connect Manually
                        </summary>
                        <div className="mt-4">
                            <TokenConnect accentColor={accentColor} onConnectClicked={onConnectClicked} />
                        </div>
                    </details>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};