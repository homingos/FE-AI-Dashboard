// FILE: app/api/magic-paint/route.ts

import { NextResponse } from "next/server";

// Define the endpoints
const RUNPOD_ENDPOINT = "https://api.runpod.ai/v2/ltmusc3gbyqjrr";
const RESOURCE_API_URL = "https://fi.development.flamapis.com/resource-svc/api/v1/resources";

// This is the single, exported function that handles all POST requests.
// This structure will fix the 405 error.
export async function POST(request: Request) {
    try {
        // Read the request body ONCE at the top
        const body = await request.json();
        const { action } = body;

        // --- Router logic based on the 'action' field ---

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
                console.error("API Error (getSignedUrl):", errorText);
                return NextResponse.json({ error: `Failed to get signed URL: ${errorText}` }, { status: response.status });
            }

            const data = await response.json();
            const responseData = data.data || data;
            const signedUrl = responseData.signed_url || responseData.upload_url || responseData.signedUrl || responseData.uploadUrl || responseData.url;
            const fileUrl = responseData.resource_url || responseData.file_url || responseData.download_url || responseData.fileUrl || responseData.downloadUrl || responseData.public_url || responseData.publicUrl;

            if (!signedUrl || !fileUrl) {
                console.error("API Response Missing Keys (getSignedUrl):", responseData);
                return NextResponse.json({ error: "API response missing 'signed_url' or 'file_url'" }, { status: 500 });
            }
            
            return NextResponse.json({ signedUrl, fileUrl });

        } else if (action === 'runpod') {
            const { endpoint, payload } = body;
            const fullUrl = `${RUNPOD_ENDPOINT}${endpoint}`;

            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });

        } else if (action === 'runpod_status') {
             const { endpoint } = body;
             const fullUrl = `${RUNPOD_ENDPOINT}${endpoint}`;

             const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
                }
            });
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

        // If the 'action' is none of the above
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

    } catch (error) {
        console.error("General Error in /api/magic-paint:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}