import jwt from 'jsonwebtoken'

const SECRET = process.env.NEXTAUTH_SECRET!

export interface InstallerPayload {
  sub: string
  name: string
  role: string
  iat: number
  exp: number
}

export function signInstallerToken(installer: { id: string; name: string; role: string }): string {
  return jwt.sign(
    { sub: installer.id, name: installer.name, role: installer.role },
    SECRET,
    { expiresIn: '30d' }
  )
}

export function verifyInstallerToken(token: string): InstallerPayload {
  return jwt.verify(token, SECRET) as InstallerPayload
}

export function getInstallerFromRequest(req: Request): InstallerPayload | null {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  try {
    return verifyInstallerToken(auth.slice(7))
  } catch {
    return null
  }
}
