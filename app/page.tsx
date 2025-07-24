// FILE: app/page.tsx

import type { Metadata } from "next"
import HomePage from "./HomePage" // Make sure this path points to your component file

// --- THIS IS THE CHANGE ---
// Add this metadata object to set the title and description
export const metadata: Metadata = {
  title: "Flam AI Dashboard",
  description:
    "Your one-stop hub to explore, interact with, and deploy powerful AI models.",
}
// --- END OF CHANGE ---

// This Server Component now renders your Client Component
export default function Page() {
  return <HomePage />
}