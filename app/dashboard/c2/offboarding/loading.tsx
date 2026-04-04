export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-32 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-4 w-48 bg-[#222] rounded" />
      </div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-36 bg-[#2a2a2a] rounded" />
              <div className="h-5 w-24 bg-[#2a2a2a] rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-8 bg-[#1a1a1a] rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
