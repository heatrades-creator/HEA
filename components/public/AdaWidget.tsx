"use client"

// components/public/AdaWidget.tsx
//
// OpenSolar Ada AI Lead Gen widget embed.
// DISABLED BY DEFAULT — requires explicit env var to enable.
//
// DO NOT enable until confirmed with OpenSolar support:
// "Does the Ada widget auto-create a billable project, or only a contact?"
// If it creates a project → the widget must NOT be enabled (paid action requires human gate).
// If it only creates a contact → safe to enable (free action).
//
// Enable by setting in .env:
//   ADA_WIDGET_ENABLED=true
//   NEXT_PUBLIC_ADA_WIDGET_ENABLED=true
//   NEXT_PUBLIC_ADA_WIDGET_EMBED_CODE=<paste from OpenSolar → AI Lead Gen settings>

export function AdaWidget() {
  const enabled   = process.env.NEXT_PUBLIC_ADA_WIDGET_ENABLED === "true"
  const embedCode = process.env.NEXT_PUBLIC_ADA_WIDGET_EMBED_CODE

  if (!enabled || !embedCode) {
    return null
  }

  return (
    <div
      id="ada-widget-container"
      dangerouslySetInnerHTML={{ __html: embedCode }}
    />
  )
}
