import BatteryQuizWidget from "./BatteryQuizWidget";

interface PageProps {
  searchParams: Promise<{ cta?: string; label?: string }>;
}

export default async function BatteryQuizEmbedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctaUrl = params.cta ? decodeURIComponent(params.cta) : "https://hea-group.com.au/intake?service=battery";
  const ctaLabel = params.label ? decodeURIComponent(params.label) : "Get My Battery Quote";

  return (
    <div className="p-4 sm:p-6">
      <BatteryQuizWidget ctaUrl={ctaUrl} ctaLabel={ctaLabel} />
    </div>
  );
}
