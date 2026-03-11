import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { Plus, Phone, MapPin, Eye } from 'lucide-react'
import { format } from 'date-fns'

const MEALS = [
    { key: 'breakfast', emoji: '🌅', label: 'B', cls: 'breakfast' },
    { key: 'lunch', emoji: '☀️', label: 'L', cls: 'lunch' },
    { key: 'dinner', emoji: '🌙', label: 'D', cls: 'dinner' },
]

function TodayStatus({ status }) {
    const activeMeals = MEALS.filter(m => status?.[m.key])
    const hasAny = activeMeals.length > 0

    if (!hasAny) {
        return (
            <span style={{
                fontSize: '0.75rem', color: 'var(--text-muted)',
                fontStyle: 'italic',
            }}>
                No delivery today
            </span>
        )
    }

    return (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {MEALS.map(m => (
                <span key={m.key} title={m.key.charAt(0).toUpperCase() + m.key.slice(1)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 999,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    opacity: status?.[m.key] ? 1 : 0.2,
                    background: status?.[m.key]
                        ? m.key === 'breakfast' ? 'rgba(245,158,11,0.15)'
                            : m.key === 'lunch' ? 'rgba(22,163,74,0.15)'
                                : 'rgba(99,102,241,0.15)'
                        : 'var(--bg-surface)',
                    color: status?.[m.key]
                        ? m.key === 'breakfast' ? '#f59e0b'
                            : m.key === 'lunch' ? 'var(--primary)'
                                : '#6366f1'
                        : 'var(--border)',
                    border: `1px solid ${status?.[m.key]
                        ? m.key === 'breakfast' ? 'rgba(245,158,11,0.3)'
                            : m.key === 'lunch' ? 'rgba(22,163,74,0.3)'
                                : 'rgba(99,102,241,0.3)'
                        : 'transparent'}`,
                    transition: 'all 0.2s',
                }}>
                    {m.emoji}
                </span>
            ))}
        </div>
    )
}

export default function CustomerList() {
    const [customers, setCustomers] = useState([])
    const [todayStatus, setTodayStatus] = useState({})
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        Promise.all([
            api.get('/customers/'),
            api.get('/customers/today-status'),
        ]).then(([custRes, statusRes]) => {
            setCustomers(custRes.data)
            setTodayStatus(statusRes.data)
        }).finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
        </div>
    )

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        🌅 Breakfast &nbsp;·&nbsp; ☀️ Lunch &nbsp;·&nbsp; 🌙 Dinner — today's delivery status
                    </div>
                </div>
                <Link to="/customers/new" className="btn btn-primary">
                    <Plus size={16} /> New Customer
                </Link>
            </div>

            {customers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <p>No customers yet.</p>
                    <Link to="/customers/new" className="btn btn-primary">
                        <Plus size={16} /> Add First Customer
                    </Link>
                </div>
            )}

            {/* Desktop table */}
            {customers.length > 0 && (
                <>
                    <div className="table-container hide-mobile">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th>Joined</th>
                                    <th>Today's Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                                        <td style={{ color: 'var(--text-muted)', maxWidth: 220 }}>{c.address}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                            {c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : '—'}
                                        </td>
                                        <td>
                                            <TodayStatus status={todayStatus[c.id]} />
                                        </td>
                                        <td>
                                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                                                onClick={() => navigate(`/customers/${c.id}`)}>
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile card list */}
                    <div className="hide-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {customers.map(c => (
                            <div key={c.id} className="customer-card" onClick={() => navigate(`/customers/${c.id}`)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                    <div className="customer-card-name">{c.name}</div>
                                    <TodayStatus status={todayStatus[c.id]} />
                                </div>
                                <div className="customer-card-meta">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Phone size={12} /> {c.phone}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <MapPin size={12} /> {c.address}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
