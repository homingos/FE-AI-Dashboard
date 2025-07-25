import { NextResponse } from "next/server";

const RUNPOD_ENDPOINT = process.env.RUNPOD_ENDPOINT_WALLPAINT;
const RESOURCE_API_URL = process.env.RESOURCE_API_URL;

export async function POST(request: Request) {
    try {
        // Check if all necessary environment variables are set
        if (!RUNPOD_ENDPOINT || !RESOURCE_API_URL || !process.env.RUNPOD_API_KEY) {
            console.error("Missing required environment variables for magic-paint API route.");
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

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error (getSignedUrl):", errorText);
                return NextResponse.json({ error: `Failed to get signed URL: ${errorText}` }, { status: response.status });
            }

            const data = await response.json();
            const responseData = data.data || data;
            const signedUrl = responseData.signed_url || responseData.upload_url;
            const fileUrl = responseData.resource_url || responseData.file_url;

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
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Runpod API Error (Status ${response.status}):`, errorText);
                return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: response.status });
            }
            const data = await response.json();
            return NextResponse.json(data);

        } else if (action === 'runpod_status') {
             const { endpoint } = body;
             const fullUrl = `${RUNPOD_ENDPOINT}${endpoint}`;

             const response = await fetch(fullUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Runpod Status API Error (Status ${response.status}):`, errorText);
                return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: response.status });
            }
            const data = await response.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("General Error in /api/magic-paint:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}