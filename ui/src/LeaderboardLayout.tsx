import { DataStax } from "./DataStax";

export function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="py-8 grid gap-16 content-start grid-rows-[auto_1fr] h-screen">
      <div className="max-w-[200px] w-full mx-auto">
        <DataStax />
      </div>
      <div className="grid gap-8 w-screen p-16 mx-auto content-start h-full">
        {children}
      </div>
    </main>
  );
}
