export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-center text-white">
      <div className="max-w-3xl space-y-4">
        <p className="text-lg font-medium text-emerald-300">GoodBois build scaffold</p>
        <h1 className="text-5xl font-semibold tracking-normal">
          Void-deck voice kiosk for elderly residents
        </h1>
        <p className="text-xl leading-8 text-neutral-200">
          The legacy Supabase/FastAPI starter has been removed. Build the kiosk UI
          against the mock `POST /turn` contract, then wire the Cloudflare Worker.
        </p>
      </div>
    </main>
  );
}
