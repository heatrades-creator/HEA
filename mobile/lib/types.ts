export interface GASJob {
  jobNumber: string
  clientName: string
  phone: string
  email: string
  address: string
  status: string
  driveUrl: string
  notes: string
  createdDate: string
  systemSize: string
  batterySize: string
  totalPrice: string
  annualBill: string
  financeRequired: boolean
  occupants: string
  homeDaytime: string
  hotWater: string
  gasAppliances: string
  ev: string
  wifiSsid: string
  wifiPassword: string
  epsCircuit1: string
  epsCircuit2: string
  epsCircuit3: string
}

export interface InstallerProfile {
  id: string
  name: string
  role: string
}

export interface Comment {
  id: string
  createdAt: string
  jobNumber: string
  body: string
  installerId: string | null
  staffEmail: string | null
  installer: { id: string; name: string } | null
  replies: Array<{
    id: string
    createdAt: string
    body: string
    installerId: string | null
    staffEmail: string | null
    installer: { id: string; name: string } | null
  }>
}

export interface Contact {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  category: string
  notes: string | null
}

export interface QRPayload {
  action: 'join_job'
  jobNumber: string
  installerName: string
  ts: number
}
