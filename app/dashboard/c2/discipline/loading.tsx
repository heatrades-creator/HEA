export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-28 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-4 w-44 bg-[#222] rounded" />
      </div>
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#252525]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="h-4 w-40 bg-[#2a2a2a] rounded mb-1.5" />
                <div className="h-3 w-28 bg-[#222] rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-[#2a2a2a] rounded-full" />
                <div className="h-5 w-20 bg-[#2a2a2a] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
