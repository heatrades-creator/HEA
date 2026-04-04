export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-20 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-4 w-44 bg-[#222] rounded" />
      </div>
      <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#2e2e2e] px-4 py-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-16 bg-[#2a2a2a] rounded" />
          ))}
        </div>
        <div className="divide-y divide-[#252525]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex-1">
                <div className="h-4 w-64 bg-[#2a2a2a] rounded mb-1.5" />
                <div className="h-3 w-36 bg-[#222] rounded" />
              </div>
              <div className="h-5 w-12 bg-[#2a2a2a] rounded-full ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
