// /app/api/wall-painting-v2/route.ts

import { NextResponse } from "next/server";

const RUNPOD_ENDPOINT_V2 = process.env.RUNPOD_ENDPOINT_WALLPAINT_V2;
const RESOURCE_API_URL = process.env.RESOURCE_API_URL;

export async function POST(request: Request) {
    try {
        if (!RUNPOD_ENDPOINT_V2 || !RESOURCE_API_URL || !process.env.RUNPOD_API_KEY) {
            console.error("Missing required environment variables for wall-painting-v2 API route.");
            return NextResponse.json({ error: "API endpoint is not configured correctly on the server." }, { status: 500 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'getSignedUrl') {
            const { fileName, fileType } = body;
            const payload = { "file_name": fileName, "type": fileType };
            const response = await fetch(RESOURCE_API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            if (!response.ok) { const errorText = await response.text(); return NextResponse.json({ error: `Failed to get signed URL: ${errorText}` }, { status: response.status }); }
            const data = await response.json();
            const responseData = data.data || data;
            const signedUrl = responseData.signed_url || responseData.upload_url;
            const fileUrl = responseData.resource_url || responseData.file_url;
            if (!signedUrl || !fileUrl) { return NextResponse.json({ error: "API response missing 'signed_url' or 'file_url'" }, { status: 500 }); }
            return NextResponse.json({ signedUrl, fileUrl });
        }
        
        if (action === 'runpod_run') {
            const { data_from_frontend } = body;
            const finalPayload = {
              "input": {
                "endpoint": "recolor",
                "data": {
                  "img_url": data_from_frontend.img_url,
                  "output_signed_url": data_from_frontend.output_signed_url,
                  "prompt": "change the wall color to the respective color of the patch and remove the patch"
                }
              }
            };
            
            const fullUrl = `${RUNPOD_ENDPOINT_V2}/run`; // Use ASYNC endpoint

            const runpodResponse = await fetch(fullUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` 
                },
                body: JSON.stringify(finalPayload)
            });

            if (!runpodResponse.ok) {
                const errorText = await runpodResponse.text();
                return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: runpodResponse.status });
            }
            const data = await runpodResponse.json();
            return NextResponse.json(data);
        }

        if (action === 'runpod_status') {
            const { jobId } = body;
            const fullUrl = `${RUNPOD_ENDPOINT_V2}/status/${jobId}`;

            const statusResponse = await fetch(fullUrl, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` 
                }
            });

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                return NextResponse.json({ error: `Runpod Status API Error: ${errorText}` }, { status: statusResponse.status });
            }
            const data = await statusResponse.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("General Error in /api/wall-painting-v2:", errorMessage);
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}