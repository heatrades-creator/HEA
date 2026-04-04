export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-40 bg-[#eef0f5] rounded mb-2" />
        <div className="h-4 w-64 bg-[#f5f7fb] rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-[#e5e9f0] rounded-xl p-5">
            <div className="h-3 w-20 bg-[#eef0f5] rounded mb-4" />
            <div className="h-8 w-12 bg-[#eef0f5] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#e5e9f0] rounded-xl p-5">
        <div className="h-3 w-32 bg-[#eef0f5] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#edf0f5]">
              <div>
                <div className="h-4 w-36 bg-[#eef0f5] rounded mb-1.5" />
                <div className="h-3 w-24 bg-[#f5f7fb] rounded" />
              </div>
              <div className="h-5 w-16 bg-[#eef0f5] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
