export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-40 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-4 w-64 bg-[#222] rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5">
            <div className="h-3 w-20 bg-[#2a2a2a] rounded mb-4" />
            <div className="h-8 w-12 bg-[#2a2a2a] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5">
        <div className="h-3 w-32 bg-[#2a2a2a] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#252525]">
              <div>
                <div className="h-4 w-36 bg-[#2a2a2a] rounded mb-1.5" />
                <div className="h-3 w-24 bg-[#222] rounded" />
              </div>
              <div className="h-5 w-16 bg-[#2a2a2a] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
