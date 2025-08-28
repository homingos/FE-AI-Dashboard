// /app/api/livekit-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import type { AccessTokenOptions, VideoGrant } from "livekit-server-sdk";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

// ... (generateRandomAlphanumeric function remains the same) ...
function generateRandomAlphanumeric(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


export async function POST(req: NextRequest) {
  console.log("--- LiveKit Token API Route Hit ---"); // <-- ADD THIS
  try {
    if (!apiKey || !apiSecret) {
      console.error("LiveKit server environment variables are not set up correctly."); // <-- ADD THIS
      return NextResponse.json(
        { error: "LiveKit server environment variables are not set up correctly" },
        { status: 500 }
      );
    }
    
    console.log("API keys are present."); // <-- ADD THIS

    const body = await req.json();
    console.log("Request Body:", body); // <-- ADD THIS
    
    const {
      roomName: roomNameFromBody,
      participantName: participantNameFromBody,
      participantId: participantIdFromBody,
      agentName: agentNameFromBody,
      metadata: metadataFromBody,
      attributes: attributesFromBody
    } = body;
    
    const roomName = (roomNameFromBody as string) || `agent-room-${generateRandomAlphanumeric(4)}`;
    const identity = (participantIdFromBody as string) || `user-${generateRandomAlphanumeric(4)}`;
    const participantName = (participantNameFromBody as string) || identity;

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };

    const at = new AccessToken(apiKey, apiSecret, { identity, name: participantName, metadata: metadataFromBody, attributes: attributesFromBody });
    at.addGrant(grant);
    
    const token = await at.toJwt();
    
    console.log(`Successfully created token for user ${identity} in room ${roomName}`); // <-- ADD THIS
    
    return NextResponse.json({ identity, accessToken: token });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    console.error("Error in token API route:", errorMessage); // <-- ADD THIS
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}