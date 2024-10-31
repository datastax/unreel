export function Spinner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto text-center">
      <div className="block mx-auto animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4" />
      {children}
    </div>
  );
}
