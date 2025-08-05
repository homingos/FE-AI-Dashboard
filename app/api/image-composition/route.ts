import { NextResponse } from "next/server";

// Ensure this environment variable is set in your .env.local file
const RUNPOD_ENDPOINT_COMPOSITION = process.env.RUNPOD_ENDPOINT_COMPOSITION;

export async function POST(request: Request) {
    try {
        // Since the frontend builds the entire payload, we just need to forward it.
        const { payload } = await request.json();

        if (!RUNPOD_ENDPOINT_COMPOSITION) {
            console.error("RUNPOD_ENDPOINT_COMPOSITION is not set in .env.local");
            return NextResponse.json({ error: 'Image Composition endpoint is not configured on the server.' }, { status: 500 });
        }

        if (!process.env.RUNPOD_API_KEY) {
            console.error("RUNPOD_API_KEY is not set in .env.local");
            return NextResponse.json({ error: 'Runpod API Key is not configured on the server.' }, { status: 500 });
        }
        
        // Directly proxy the request to the Runpod /runsync endpoint
        const fullUrl = `${RUNPOD_ENDPOINT_COMPOSITION}/runsync`;

        const runpodResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
            },
            body: JSON.stringify(payload) // Directly forward the payload built by the frontend
        });

        // Handle non-OK responses from Runpod by returning its exact error
        if (!runpodResponse.ok) {
            const errorText = await runpodResponse.text();
            console.error(`Runpod API Error (Status: ${runpodResponse.status}):`, errorText);
            // Try to parse the error as JSON, but fall back to text
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json({ error: errorJson.error || "Unknown Runpod Error" }, { status: runpodResponse.status });
            } catch (e) {
                return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: runpodResponse.status });
            }
        }
        
        const data = await runpodResponse.json();
        // Forward the exact successful response from Runpod to the frontend
        return NextResponse.json(data);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Internal Server Error in /api/image-composition:", errorMessage);
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}