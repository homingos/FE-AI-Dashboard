import { NextResponse } from "next/server";

const RUNPOD_ENDPOINT_COMPOSITION = process.env.RUNPOD_ENDPOINT_COMPOSITION;

export async function POST(request: Request) {
    try {
        const { payload } = await request.json();
        if (!RUNPOD_ENDPOINT_COMPOSITION) {
            return NextResponse.json({ error: 'Image Composition endpoint not configured.' }, { status: 500 });
        }
        
        const fullUrl = `${RUNPOD_ENDPOINT_COMPOSITION}/runsync`;
        const runpodResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}` },
            body: JSON.stringify(payload)
        });

        if (!runpodResponse.ok) {
            const errorText = await runpodResponse.text();
            return NextResponse.json({ error: `Runpod API Error: ${errorText}` }, { status: runpodResponse.status });
        }
        const data = await runpodResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}