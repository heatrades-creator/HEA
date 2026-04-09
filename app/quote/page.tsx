import { redirect } from "next/navigation"
import { GAS_INTAKE_URL } from "@/lib/constants"

export const metadata = {
  title: "Free Solar Quote | HEA Group",
  description:
    "Get a free, no-obligation solar quote from HEA Group. " +
    "Solar & battery installation in Bendigo and regional Victoria.",
}

export default function QuotePage() {
  redirect(GAS_INTAKE_URL)
}
