'use client'

import { useEffect, useState } from 'react'

type Contact = {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  category: string
  notes: string | null
  active: boolean
}

const CATEGORIES = ['supplier', 'electrician', 'other']

const CATEGORY_LABELS: Record<string, string> = {
  supplier: 'Supplier',
  electrician: 'Electrician',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  supplier: 'bg-blue-100 text-blue-800',
  electrician: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-700',
}

type FormState = {
  name: string
  company: string
  phone: string
  email: string
  category: string
  notes: string
}

const EMPTY_FORM: FormState = { name: '', company: '', phone: '', email: '', category: 'supplier', notes: '' }

export function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/dashboard/contacts')
    if (res.ok) setContacts(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(c: Contact) {
    setEditId(c.id)
    setForm({ name: c.name, company: c.company ?? '', phone: c.phone ?? '', email: c.email ?? '', category: c.category, notes: c.notes ?? '' })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const url = editId ? `/api/dashboard/contacts/${editId}` : '/api/dashboard/contacts'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Save failed')
    } else {
      setShowForm(false)
      await load()
    }
    setSaving(false)
  }

  async function toggleActive(c: Contact) {
    await fetch(`/api/dashboard/contacts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await fetch(`/api/dashboard/contacts/${id}`, { method: 'DELETE' })
    await load()
  }

  const grouped = CATEGORIES.reduce<Record<string, Contact[]>>((acc, cat) => {
    acc[cat] = contacts.filter(c => c.category === cat)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Contacts visible to installers in the mobile app. Active contacts appear; inactive ones are hidden.
        </p>
        <button
          onClick={openNew}
          className="bg-[#ffd100] text-[#111827] text-sm font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          + New Contact
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : contacts.length === 0 ? (
        <div className="border border-dashed border-[#e5e9f0] rounded-xl p-10 text-center">
          <p className="text-[#374151] font-semibold mb-1">No contacts yet</p>
          <p className="text-sm text-gray-400">Add suppliers, electricians, and other site contacts here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map(cat => {
            const items = grouped[cat]
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="border border-[#e5e9f0] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f9fafb] border-b border-[#e5e9f0]">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide hidden sm:table-cell">Phone</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide hidden md:table-cell">Notes</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e9f0]">
                      {items.map(c => (
                        <tr key={c.id} className={`${!c.active ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#111827]">{c.name}</p>
                            {c.company && <p className="text-xs text-[#6b7280]">{c.company}</p>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-[#374151]">
                            {c.phone ? (
                              <a href={`tel:${c.phone}`} className="hover:text-[#ffd100] transition-colors">{c.phone}</a>
                            ) : <span className="text-[#d1d5db]">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-[#6b7280] max-w-xs truncate">
                            {c.notes || <span className="text-[#d1d5db]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.category]}`}>
                              {c.active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => openEdit(c)}
                                className="text-xs text-[#374151] hover:text-[#111827] underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleActive(c)}
                                className="text-xs text-[#374151] hover:text-[#111827] underline"
                              >
                                {c.active ? 'Hide' : 'Show'}
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="text-xs text-red-400 hover:text-red-600 underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-[#111827] mb-5">
              {editId ? 'Edit Contact' : 'New Contact'}
            </h2>

            <div className="space-y-4">
              <Field label="Name *">
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rexel Electrical Supplies"
                  className={INPUT}
                />
              </Field>

              <Field label="Company (optional)">
                <input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Company name if name is a person"
                  className={INPUT}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone">
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="03 5441 0000"
                    className={INPUT}
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contact@example.com"
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field label="Category">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={INPUT}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </Field>

              <Field label="Notes (optional)">
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Open 7am–5pm Mon–Fri"
                  className={INPUT}
                />
              </Field>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#ffd100] text-[#111827] font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Contact'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-[#e5e9f0] text-[#374151] font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const INPUT = 'w-full border border-[#e5e9f0] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#ffd100] bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}
