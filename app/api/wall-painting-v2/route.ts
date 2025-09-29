// /app/api/wall-painting-v2/route.ts

import { NextResponse } from "next/server";

// Read endpoints from environment variables
const RUNPOD_ENDPOINT_PBR = process.env.RUNPOD_ENDPOINT_WALLPAINT_V2; // <-- Use the new V2 endpoint
const RESOURCE_API_URL = process.env.RESOURCE_API_URL;

export async function POST(request: Request) {
    try {
        // Check if all necessary environment variables are set
        if (!RUNPOD_ENDPOINT_PBR || !RESOURCE_API_URL || !process.env.RUNPOD_API_KEY) {
            console.error("Missing required environment variables for wall-painting-v2 API route.");
            return NextResponse.json({ error: "API endpoint is not configured correctly on the server." }, { status: 500 });
        }

        const body = await request.json();
        const { action } = body;

        // Action to get a signed URL for uploading files (e.g., the patched image)
        if (action === 'getSignedUrl') {
            const { fileName, fileType } = body;
            const payload = { "file_name": fileName, "type": fileType };
            const response = await fetch(RESOURCE_API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            
            if (!response.ok) { 
                const errorText = await response.text(); 
                return NextResponse.json({ error: `Failed to get signed URL: ${errorText}` }, { status: response.status }); 
            }
            
            const data = await response.json();
            const responseData = data.data || data;
            const signedUrl = responseData.signed_url || responseData.upload_url;
            const fileUrl = responseData.resource_url || responseData.file_url;
            
            if (!signedUrl || !fileUrl) { 
                return NextResponse.json({ error: "API response missing 'signed_url' or 'file_url'" }, { status: 500 }); 
            }
            return NextResponse.json({ signedUrl, fileUrl });
        }
        
        // Action to run the actual AI job on Runpod
        if (action === 'runpod') {
            const { payload } = body;
            const fullUrl = `${RUNPOD_ENDPOINT_PBR}/runsync`; // Using /runsync for immediate results

            const runpodResponse = await fetch(fullUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` 
                },
                body: JSON.stringify(payload)
            });

            if (!runpodResponse.ok) {
                const errorText = await runpodResponse.text();
                console.error(`Wall Painting V2 Runpod API Error (Status ${runpodResponse.status}):`, errorText);
                return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: runpodResponse.status });
            }
            const data = await runpodResponse.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("General Error in /api/wall-painting-v2:", errorMessage);
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}