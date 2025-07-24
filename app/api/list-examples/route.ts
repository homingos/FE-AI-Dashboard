import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const examplesDir = path.join(process.cwd(), 'public', 'examples');
        const humanDir = path.join(examplesDir, 'human');
        const garmentDir = path.join(examplesDir, 'garment');

        // Read the contents of both directories
        const humanFiles = await fs.readdir(humanDir);
        const garmentFiles = await fs.readdir(garmentDir);

        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

        // Filter for images and create the public URL paths
        const humanExamplePaths = humanFiles
            .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
            .map(file => `/examples/human/${file}`);

        const garmentExamples = garmentFiles
            .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
            .map(file => {
                // Automatically generate a description from the filename
                // e.g., "red_tshirt.png" becomes "red t-shirt"
                const description = file.split('.')[0].replace(/_/g, ' ');
                return {
                    path: `/examples/garment/${file}`,
                    description: description,
                };
            });

        return NextResponse.json({
            humanExamples: humanExamplePaths.map(path => ({ path })), // Keep a consistent object structure
            garmentExamples,
        });

    } catch (error) {
        console.error("Error listing example files:", error);
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json({ error: "The 'public/examples/human' or 'public/examples/garment' directory was not found on the server." }, { status: 500 });
        }
        return NextResponse.json({ error: "Failed to list example files from the server." }, { status: 500 });
    }
}