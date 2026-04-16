export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-900">Promptly</h1>
      <p className="mt-3 text-gray-500 text-center max-w-md">
        Install the browser extension to craft better AI prompts.
        The API is running at <code>/api/interview</code> and <code>/api/synthesize</code>.
      </p>
    </main>
  )
}
