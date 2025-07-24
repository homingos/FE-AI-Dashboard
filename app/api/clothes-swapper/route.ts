import { NextResponse } from "next/server";

// Ensure this environment variable is set in your .env.local file
const RUNPOD_ENDPOINT_CLOTHES = process.env.RUNPOD_ENDPOINT_CLOTHES;

export async function POST(request: Request) {
    try {
        // Since we only have one action now, we can simplify this.
        const { payload } = await request.json();

        if (!RUNPOD_ENDPOINT_CLOTHES) {
            console.error("RUNPOD_ENDPOINT_CLOTHES is not set in .env.local");
            return NextResponse.json({ error: 'Clothes Swapper endpoint is not configured on the server.' }, { status: 500 });
        }

        if (!process.env.RUNPOD_API_KEY) {
            console.error("RUNPOD_API_KEY is not set in .env.local");
            return NextResponse.json({ error: 'Runpod API Key is not configured on the server.' }, { status: 500 });
        }
        
        // Directly proxy the request to the Runpod /runsync endpoint
        const fullUrl = `${RUNPOD_ENDPOINT_CLOTHES}/runsync`;

        const runpodResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
            },
            body: JSON.stringify(payload) // Directly forward the payload built by the frontend
        });

        // Handle non-OK responses from Runpod by returning the text
        if (!runpodResponse.ok) {
            const errorText = await runpodResponse.text();
            console.error(`Runpod API Error (Status: ${runpodResponse.status}):`, errorText);
            return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: runpodResponse.status });
        }

        // Try to parse the JSON, but have a fallback if it's empty or invalid
        const responseText = await runpodResponse.text();
        if (!responseText) {
            return NextResponse.json({ error: "Runpod returned an empty response." }, { status: 500 });
        }
        
        const data = JSON.parse(responseText);
        return NextResponse.json(data); // Next.js automatically sets status 200 here

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Internal Server Error in /api/clothes-swapper:", errorMessage);
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}