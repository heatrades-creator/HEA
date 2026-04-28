import EstimatorWidget from "./EstimatorWidget";

interface PageProps {
  searchParams: Promise<{ cta?: string; label?: string }>;
}

export default async function EstimatorEmbedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctaUrl = params.cta ? decodeURIComponent(params.cta) : "https://hea-group.com.au/intake";
  const ctaLabel = params.label ? decodeURIComponent(params.label) : "Get My Accurate Quote";

  return (
    <div className="p-4 sm:p-6">
      <EstimatorWidget ctaUrl={ctaUrl} ctaLabel={ctaLabel} />
    </div>
  );
}
