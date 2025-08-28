"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import { useMemo } from "react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { PlaygroundConnect } from "@/components/livekit/playground/PlaygroundConnect";
import Playground from "@/components/livekit/playground/Playground"; // <-- CORRECTED IMPORT (removed curly braces)
import { LiveKitConfigProvider, useLiveKitConfig } from "@/hooks/useLiveKitConfig";
import { LiveKitConnectionProvider, useLiveKitConnection, ConnectionMode } from "@/hooks/useLiveKitConnection";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const themeColors = ["sky", "green", "amber", "blue", "violet", "rose", "pink", "teal"];

function AgentPageContent() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } = useLiveKitConnection();
  const { settings } = useLiveKitConfig();
  const { toast } = useToast();
  
  const showPG = useMemo(() => {
    if (process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      return true;
    }
    return !!wsUrl;
  }, [wsUrl]);

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex-shrink-0">
          <Button asChild variant="ghost" className="text-gray-300 hover:bg-sky-400/10 hover:text-sky-400">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
          </Button>
        </motion.div>
        
        <main className={cn(
          "relative flex flex-col justify-center items-center h-full w-full grow",
          !shouldConnect && "bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl"
        )}>
          {shouldConnect ? (
            <LiveKitRoom
              className="flex flex-col h-full w-full"
              serverUrl={wsUrl}
              token={token}
              connect={true}
              audio={true}
              video={true}
              onError={(e) => {
                toast({ title: "LiveKit Error", description: e.message, variant: "destructive" });
                console.error(e);
                disconnect();
              }}
            >
              <Playground
                themeColors={themeColors}
                onConnect={(c) => {
                  c ? connect(mode) : disconnect();
                }}
              />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <PlaygroundConnect
              accentColor={themeColors[0]}
              onConnectClicked={(m) => connect(m)}
            />
          )}
        </main>
      </div>
      <Toaster />
    </>
  );
}

export default function LiveKitAgentPage() {
  return (
    <LiveKitConfigProvider>
      <LiveKitConnectionProvider>
        <AgentPageContent />
      </LiveKitConnectionProvider>
    </LiveKitConfigProvider>
  );
}