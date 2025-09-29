"use client";

import { Loader2 } from "lucide-react";
import { ChatMessageType } from "../chat/ChatTile";
import { ColorPicker } from "../colorPicker/ColorPicker";
import { AudioInputTile } from "../config/AudioInputTile";
import { ConfigurationPanelItem } from "../config/ConfigurationPanelItem";
import { NameValueRow } from "../config/NameValueRow";
import { PlaygroundHeader } from "./PlaygroundHeader";
import {
  PlaygroundTab,
  PlaygroundTabbedTile,
  PlaygroundTile,
} from "./PlaygroundTile";
import { useLiveKitConfig } from "@/hooks/useLiveKitConfig";
import { TranscriptionTile } from "../chat/TranscriptionTile";
import {
  BarVisualizer,
  VideoTrack,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useRoomInfo,
  useTracks,
  useVoiceAssistant,
  useRoomContext,
  useParticipantAttributes,
} from "@livekit/components-react";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { EditableNameValueRow } from "../config/NameValueRow";
import { AttributesInspector } from "../config/AttributesInspector";
import { RpcPanel } from "./RpcPanel";

export interface PlaygroundProps {
  logo?: ReactNode;
  themeColors: string[];
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

const headerHeight = 56;

export default function Playground({ // <-- CHANGED BACK TO export default
  logo,
  themeColors,
  onConnect,
}: PlaygroundProps) {
  const { settings, setSettings } = useLiveKitConfig();
  const { name } = useRoomInfo();
  const { localParticipant } = useLocalParticipant();
  const voiceAssistant = useVoiceAssistant();
  const roomState = useConnectionState();
  const tracks = useTracks();
  const room = useRoomContext();
  const [rpcMethod, setRpcMethod] = useState("");
  const [rpcPayload, setRpcPayload] = useState("");
  
  useEffect(() => {
    if (roomState === ConnectionState.Connected && localParticipant) {
      localParticipant.setCameraEnabled(settings.inputs.camera);
      localParticipant.setMicrophoneEnabled(settings.inputs.mic);
    }
  }, [settings.inputs, localParticipant, roomState]);

  const agentVideoTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Video &&
      trackRef.participant.isAgent,
  );

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant,
  );
  const localCameraTrack = localTracks.find(
    ({ source }) => source === Track.Source.Camera,
  );
  const localScreenTrack = localTracks.find(
    ({ source }) => source === Track.Source.ScreenShare,
  );
  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone,
  );

  const videoTileContent = useMemo(() => {
    const videoFitClassName = `object-contain`;

    const disconnectedContent = (
      <div className="flex items-center justify-center text-gray-700 text-center w-full h-full">
        No agent video track. Connect to get started.
      </div>
    );

    const loadingContent = (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center h-full w-full">
        <Loader2 className="animate-spin h-8 w-8 text-sky-500" />
        Waiting for agent video track…
      </div>
    );

    const videoContent = (
      <VideoTrack
        trackRef={agentVideoTrack}
        className={`absolute top-1/2 -translate-y-1/2 ${videoFitClassName} object-position-center w-full h-full`}
      />
    );

    let content = null;
    if (roomState === ConnectionState.Disconnected) {
      content = disconnectedContent;
    } else if (agentVideoTrack) {
      content = videoContent;
    } else {
      content = loadingContent;
    }

    return (
      <div className="flex flex-col w-full grow text-gray-950 bg-black rounded-sm border border-gray-800 relative">
        {content}
      </div>
    );
  }, [agentVideoTrack, roomState]);

  const audioTileContent = useMemo(() => {
    const disconnectedContent = (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center w-full">
        No agent audio track. Connect to get started.
      </div>
    );

    const waitingContent = (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center w-full">
        <Loader2 className="animate-spin h-8 w-8 text-sky-500" />
        Waiting for agent audio track…
      </div>
    );

    const visualizerContent = (
      <div
        className={`flex items-center justify-center w-full h-48 [--lk-va-bar-width:30px] [--lk-va-bar-gap:20px] [--lk-fg:var(--lk-theme-color)]`}
      >
        <BarVisualizer
          state={voiceAssistant.state}
          trackRef={voiceAssistant.audioTrack}
          barCount={5}
          options={{ minHeight: 20 }}
        />
      </div>
    );

    if (roomState === ConnectionState.Disconnected) {
      return disconnectedContent;
    }

    if (!voiceAssistant.audioTrack) {
      return waitingContent;
    }

    return visualizerContent;
  }, [
    voiceAssistant.audioTrack,
    settings.theme_color,
    roomState,
    voiceAssistant.state,
  ]);

  const chatTileContent = useMemo(() => {
    if (voiceAssistant.agent) {
      return (
        <TranscriptionTile
          agentAudioTrack={voiceAssistant.audioTrack}
          accentColor={settings.theme_color}
        />
      );
    }
    return <div className="flex items-center justify-center text-gray-700 text-center w-full h-full">Agent not found in room.</div>;
  }, [
    settings.theme_color,
    voiceAssistant.audioTrack,
    voiceAssistant.agent,
  ]);

  const handleRpcCall = useCallback(async () => {
    if (!voiceAssistant.agent || !room) {
      throw new Error("No agent or room available");
    }

    const response = await room.localParticipant.performRpc({
      destinationIdentity: voiceAssistant.agent.identity,
      method: rpcMethod,
      payload: rpcPayload,
    });
    return response;
  }, [room, rpcMethod, rpcPayload, voiceAssistant.agent]);

  const agentAttributes = useParticipantAttributes({
    participant: voiceAssistant.agent,
  });

  const settingsTileContent = useMemo(() => {
    return (
      <div className="flex flex-col h-full w-full items-start overflow-y-auto">
        <ConfigurationPanelItem title="Room">
          <div className="flex flex-col gap-2">
            <EditableNameValueRow
              name="Room name"
              value={
                roomState === ConnectionState.Connected
                  ? name
                  : settings.room_name
              }
              valueColor={`${settings.theme_color}-500`}
              onValueChange={(value) => {
                const newSettings = { ...settings };
                newSettings.room_name = value;
                setSettings(newSettings);
              }}
              placeholder="Auto"
              editable={roomState !== ConnectionState.Connected}
            />
            <NameValueRow
              name="Status"
              value={
                roomState === ConnectionState.Connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin"/>
                ) : (
                  roomState.charAt(0).toUpperCase() + roomState.slice(1)
                )
              }
              valueColor={
                roomState === ConnectionState.Connected
                  ? `${settings.theme_color}-500`
                  : "gray-500"
              }
            />
          </div>
        </ConfigurationPanelItem>
        <ConfigurationPanelItem title="Color">
          <ColorPicker
            colors={themeColors}
            selectedColor={settings.theme_color}
            onSelect={(color) => {
              const userSettings = { ...settings };
              userSettings.theme_color = color;
              setSettings(userSettings);
            }}
          />
        </ConfigurationPanelItem>
        {roomState === ConnectionState.Connected && voiceAssistant.agent && (
          <RpcPanel
            config={{ settings }}
            rpcMethod={rpcMethod}
            rpcPayload={rpcPayload}
            setRpcMethod={setRpcMethod}
            setRpcPayload={setRpcPayload}
            handleRpcCall={handleRpcCall}
          />
        )}
      </div>
    );
  }, [
    settings,
    name,
    roomState,
    themeColors,
    setSettings,
    voiceAssistant.agent,
    handleRpcCall,
    rpcMethod, 
    rpcPayload
  ]);
  
  return (
    <>
      <PlaygroundHeader
        logo={logo}
        title="Flam's Conversational AI"
        height={headerHeight}
        accentColor={settings.theme_color}
        connectionState={roomState}
        onConnectClicked={() => onConnect(roomState === ConnectionState.Disconnected)}
      />
      <div
        className={`flex gap-4 py-4 grow w-full selection:bg-${settings.theme_color}-900`}
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div
          className={`flex-col grow basis-1/2 gap-4 h-full flex`}
        >
          <PlaygroundTile
            title="Agent Video"
            className="w-full h-full grow"
            childrenClassName="justify-center"
          >
            {videoTileContent}
          </PlaygroundTile>
          <PlaygroundTile
            title="Agent Audio"
            className="w-full h-full grow"
            childrenClassName="justify-center"
          >
            {audioTileContent}
          </PlaygroundTile>
        </div>
        <PlaygroundTile
          title="Chat"
          className="h-full grow basis-1/4 flex"
        >
          {chatTileContent}
        </PlaygroundTile>
        <PlaygroundTile
          padding={false}
          backgroundColor="gray-950"
          className="h-full w-full basis-1/4 items-start overflow-y-auto max-w-[480px] flex"
          childrenClassName="h-full grow items-start"
        >
          {settingsTileContent}
        </PlaygroundTile>
      </div>
    </>
  );
}