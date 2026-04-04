export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-24 bg-[#eef0f5] rounded mb-2" />
        <div className="h-4 w-40 bg-[#f5f7fb] rounded" />
      </div>
      <div className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e5e9f0] flex gap-3">
          <div className="h-8 flex-1 bg-[#eef0f5] rounded-lg" />
          <div className="h-8 w-28 bg-[#eef0f5] rounded-lg" />
          <div className="h-8 w-28 bg-[#eef0f5] rounded-lg" />
        </div>
        <div className="divide-y divide-[#edf0f5]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="h-4 w-40 bg-[#eef0f5] rounded mb-1.5" />
                <div className="h-3 w-28 bg-[#f5f7fb] rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 bg-[#eef0f5] rounded-full" />
                <div className="h-5 w-14 bg-[#eef0f5] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
