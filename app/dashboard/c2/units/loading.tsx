export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-20 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-4 w-48 bg-[#222] rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#202020] border border-[#2e2e2e] rounded-xl p-5">
          <div className="h-4 w-24 bg-[#2a2a2a] rounded mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-[#1a1a1a] rounded" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5">
            <div className="h-4 w-20 bg-[#2a2a2a] rounded mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-[#1a1a1a] rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
