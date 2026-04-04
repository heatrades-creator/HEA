export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-32 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-4 w-52 bg-[#222] rounded" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-56 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-3">
            <div className="h-4 w-20 bg-[#2a2a2a] rounded mb-3" />
            <div className="space-y-2">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="bg-[#202020] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="h-4 w-28 bg-[#2a2a2a] rounded mb-1.5" />
                  <div className="h-3 w-20 bg-[#222] rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
