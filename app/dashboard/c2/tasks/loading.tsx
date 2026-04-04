export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-20 bg-[#eef0f5] rounded mb-2" />
        <div className="h-4 w-44 bg-[#f5f7fb] rounded" />
      </div>
      <div className="bg-white border border-[#e5e9f0] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#e5e9f0] px-4 py-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-16 bg-[#eef0f5] rounded" />
          ))}
        </div>
        <div className="divide-y divide-[#edf0f5]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex-1">
                <div className="h-4 w-64 bg-[#eef0f5] rounded mb-1.5" />
                <div className="h-3 w-36 bg-[#f5f7fb] rounded" />
              </div>
              <div className="h-5 w-12 bg-[#eef0f5] rounded-full ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
