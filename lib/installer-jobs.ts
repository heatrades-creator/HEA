import type { Lead } from '@prisma/client'

export function leadStatus(lead: Lead): string {
  if (lead.installedAt) return 'Complete'
  if (lead.contractSignedAt || lead.soldAt) return 'Booked'
  if (lead.estimationSignedAt) return 'Contract'
  if (lead.openSolarProjectId) return 'Quoted'
  return 'Lead'
}

export function leadToJob(lead: Lead) {
  return {
    jobNumber: lead.gasJobNumber ?? `LEAD-${lead.id}`,
    clientName: `${lead.firstName} ${lead.lastName}`,
    phone: lead.phone,
    email: lead.email,
    address: [lead.address, lead.suburb, lead.state, lead.postcode].filter(Boolean).join(', '),
    status: leadStatus(lead),
    driveUrl: lead.gasDriveUrl ?? '',
    notes: lead.notes ?? '',
    createdDate: lead.createdAt.toISOString().split('T')[0],
    systemSize: lead.openSolarSystemKw != null ? String(lead.openSolarSystemKw) : '',
    batterySize: '',
    totalPrice: lead.openSolarPriceAud != null
      ? `$${Math.round(lead.openSolarPriceAud).toLocaleString()}`
      : '',
    annualBill: lead.annualBillAud != null ? String(lead.annualBillAud) : '',
    financeRequired: lead.financeRequired ?? false,
    occupants: lead.occupants ?? '',
    homeDaytime: lead.homeDaytime ?? '',
    hotWater: lead.hotWater ?? '',
    gasAppliances: lead.gasAppliances ?? '',
    ev: lead.ev ?? '',
    wifiSsid: '',
    wifiPassword: '',
    epsCircuit1: '',
    epsCircuit2: '',
    epsCircuit3: '',
  }
}
