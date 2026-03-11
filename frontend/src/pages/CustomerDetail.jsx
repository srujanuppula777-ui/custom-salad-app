import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Phone, Home, Edit3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const SERVICES = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { key: 'lunch', label: 'Lunch', emoji: '☀️' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
]

export default function CustomerDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [customer, setCustomer] = useState(null)
    const [subs, setSubs] = useState([])
    const [tab, setTab] = useState('info')
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        Promise.all([
            api.get(`/customers/${id}`),
            api.get(`/subscriptions/customer/${id}`),
        ]).then(([cr, sr]) => {
            setCustomer(cr.data)
            setEditForm(cr.data)
            setSubs(sr.data)
        }).catch(() => toast.error('Failed to load customer'))
            .finally(() => setLoading(false))
    }, [id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await api.put(`/customers/${id}`, editForm)
            setCustomer(res.data)
            setEditing(false)
            toast.success('Customer updated!')
        } catch { toast.error('Update failed') }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        if (!confirm(`Delete ${customer.name}? This will remove all subscriptions too.`)) return
        try {
            await api.delete(`/customers/${id}`)
            toast.success('Customer deleted')
            navigate('/customers')
        } catch { toast.error('Delete failed') }
    }

    const deleteSub = async (subId) => {
        try {
            await api.delete(`/subscriptions/${subId}`)
            setSubs(subs.filter(s => s.id !== subId))
            toast.success('Subscription removed')
        } catch { toast.error('Failed to remove subscription') }
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
    if (!customer) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Customer not found.</div>

    return (
        <div style={{ maxWidth: 620 }}>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/customers" className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.4rem' }}>{customer.name}</h1>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Customer #{id}</div>
                    </div>
                </div>
                <button className="btn btn-danger" onClick={handleDelete}>
                    <Trash2 size={14} /> Delete
                </button>
            </div>

            {/* Tabs */}
            <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
                <button className={`tab-btn ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Info</button>
                <button className={`tab-btn ${tab === 'track' ? 'active' : ''}`} onClick={() => setTab('track')}>Track</button>
            </div>

            {/* ── INFO TAB ── */}
            {tab === 'info' && (
                <div className="card">
                    {!editing ? (
                        <>
                            <div className="info-row">
                                <span className="info-label"><Phone size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Phone</span>
                                <span className="info-value">{customer.phone}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label"><Home size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Home Address</span>
                                <span className="info-value">{customer.address}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label"><Home size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Office Address</span>
                                <span className="info-value">{customer.office_address ? customer.office_address : <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label"><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Home Location</span>
                                <span className="info-value">
                                    {customer.google_location
                                        ? <a href={customer.google_location} target="_blank" rel="noreferrer"
                                            style={{ color: 'var(--primary)', textDecoration: 'none' }}>View on Maps ↗</a>
                                        : <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label"><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Office Location</span>
                                <span className="info-value">
                                    {customer.office_google_location
                                        ? <a href={customer.office_google_location} target="_blank" rel="noreferrer"
                                            style={{ color: 'var(--primary)', textDecoration: 'none' }}>View on Maps ↗</a>
                                        : <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Joined</span>
                                <span className="info-value" style={{ color: 'var(--text-muted)' }}>
                                    {customer.created_at ? format(new Date(customer.created_at), 'PPP') : '—'}
                                </span>
                            </div>
                            <div style={{ marginTop: '1.25rem' }}>
                                <button className="btn btn-outline" onClick={() => setEditing(true)}>
                                    <Edit3 size={14} /> Edit Customer
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {['name', 'phone', 'address', 'office_address', 'google_location', 'office_google_location'].map(key => (
                                <div className="form-group" key={key}>
                                    <label className="form-label">{key.replace('_', ' ')}</label>
                                    <input className="form-input" value={editForm[key] || ''} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                                <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── TRACK TAB ── */}
            {tab === 'track' && (
                <div>
                    {/* Service selector */}
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                        Select a service to manage the subscription:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                        {SERVICES.map(svc => (
                            <Link key={svc.key} to={`/customers/${id}/subscribe/${svc.key}`}
                                style={{ textDecoration: 'none' }}>
                                <div className="service-btn">
                                    <span className="svc-icon">{svc.emoji}</span>
                                    <span>{svc.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Active subscriptions */}
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                        Active Subscriptions
                    </h3>
                    {subs.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No subscriptions yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {subs.map(sub => (
                                <div key={sub.id} style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: '0.9rem 1.1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                                }}>
                                    <div>
                                        <span className={`badge badge-${sub.service_type}`} style={{ marginRight: 8 }}>
                                            {sub.service_type}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {format(new Date(sub.start_date + 'T00:00:00'), 'MMM d')} – {format(new Date(sub.end_date + 'T00:00:00'), 'MMM d, yyyy')}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                                            ({sub.delivery_schedule ? `${Object.keys(sub.delivery_schedule).length} custom days` : sub.day_type})
                                        </span>
                                    </div>
                                    <button className="btn btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                                        onClick={() => deleteSub(sub.id)}>
                                        <Trash2 size={12} /> Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
