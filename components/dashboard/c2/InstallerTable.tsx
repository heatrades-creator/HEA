'use client'

import { useEffect, useState } from 'react'

interface Installer {
  id: string
  name: string
  role: string
  active: boolean
  createdAt: string
}

export function InstallerTable() {
  const [installers, setInstallers] = useState<Installer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', pin: '', role: 'installer' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/dashboard/installers')
    if (res.ok) setInstallers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/dashboard/installers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      setForm({ name: '', pin: '', role: 'installer' })
      load()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create installer')
    }
    setSaving(false)
  }

  async function toggleActive(installer: Installer) {
    await fetch(`/api/dashboard/installers/${installer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !installer.active }),
    })
    load()
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e9f0]">
        <p className="text-sm font-semibold text-[#111827]">{installers.length} installer{installers.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#ffd100] text-[#111827] hover:bg-yellow-300 transition-colors"
        >
          + New Installer
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
      ) : installers.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">No installers yet. Add one to get started.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e9f0]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e9f0]">
            {installers.map(inst => (
              <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-[#111827]">{inst.name}</td>
                <td className="px-5 py-3 text-gray-500 capitalize">{inst.role}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    inst.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {inst.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toggleActive(inst)}
                    className="text-xs text-gray-400 hover:text-[#111827] transition-colors"
                  >
                    {inst.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#111827] mb-4">New Installer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jake Smith"
                  className="w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">4-digit PIN</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin}
                  onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="1234"
                  className="w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ffd100]"
                >
                  <option value="installer">Installer</option>
                  <option value="lead">Lead Installer</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowModal(false); setError('') }}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[#e5e9f0] text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={saving || !form.name || form.pin.length !== 4}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[#ffd100] text-[#111827] hover:bg-yellow-300 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
