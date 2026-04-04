export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-32 bg-[#eef0f5] rounded mb-2" />
        <div className="h-4 w-52 bg-[#f5f7fb] rounded" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-56 bg-[#f5f7fb] border border-[#e5e9f0] rounded-xl p-3">
            <div className="h-4 w-20 bg-[#eef0f5] rounded mb-3" />
            <div className="space-y-2">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="bg-white border border-[#e5e9f0] rounded-lg p-3">
                  <div className="h-4 w-28 bg-[#eef0f5] rounded mb-1.5" />
                  <div className="h-3 w-20 bg-[#f5f7fb] rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
