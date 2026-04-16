import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Promptly",
  description: "Craft better AI prompts through an expert interview process"
}

export default function RootLayout({
  children
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
