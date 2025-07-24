import { NextResponse } from "next/server";

// Ensure this environment variable is set in your .env.local file
const RUNPOD_ENDPOINT_PBR = process.env.RUNPOD_ENDPOINT_PBRMAP;
const RESOURCE_API_URL = "https://fi.development.flamapis.com/resource-svc/api/v1/resources";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (!RUNPOD_ENDPOINT_PBR) {
            return NextResponse.json({ error: 'PBR Map endpoint is not configured on the server.' }, { status: 500 });
        }

        if (action === 'getSignedUrl') {
            const { fileName, fileType } = body;
            const payload = { "file_name": fileName, "type": fileType };
            const response = await fetch(RESOURCE_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { const errorText = await response.text(); return NextResponse.json({ error: `Failed to get signed URL: ${errorText}` }, { status: response.status }); }
            const data = await response.json();
            const responseData = data.data || data;
            const signedUrl = responseData.signed_url || responseData.upload_url;
            const fileUrl = responseData.resource_url || responseData.file_url;
            if (!signedUrl || !fileUrl) { return NextResponse.json({ error: "API response missing 'signed_url' or 'file_url'" }, { status: 500 }); }
            return NextResponse.json({ signedUrl, fileUrl });
        }

        // --- MODIFIED: This is now the primary action for generating maps ---
        if (action === 'runpod') {
            const { endpoint, payload } = body; // endpoint will be '/runsync' or '/run'
            const fullUrl = `${RUNPOD_ENDPOINT_PBR}${endpoint}`;

            const runpodResponse = await fetch(fullUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` },
                body: JSON.stringify(payload) // Directly forward the payload built by the frontend
            });

            if (!runpodResponse.ok) {
                const errorText = await runpodResponse.text();
                return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: runpodResponse.status });
            }
            const data = await runpodResponse.json();
            return NextResponse.json(data, { status: runpodResponse.status });
        }

        if (action === 'runpod_status') {
            const { endpoint } = body;
            const fullUrl = `${RUNPOD_ENDPOINT_PBR}${endpoint}`;
            const statusResponse = await fetch(fullUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` } });
            if (!statusResponse.ok) { const errorText = await statusResponse.text(); return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: statusResponse.status }); }
            const data = await statusResponse.json();
            return NextResponse.json(data, { status: data.status });
        }

        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}