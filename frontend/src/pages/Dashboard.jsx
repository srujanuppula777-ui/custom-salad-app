import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import { format, parseISO } from 'date-fns'
import { RefreshCw, CalendarCheck, Sunrise, Sun, Moon } from 'lucide-react'

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [modalInfo, setModalInfo] = useState({ title: '', details: [] })

    const openModal = (title, details) => {
        setModalInfo({ title, details: details || [] })
        setModalOpen(true)
    }

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/dashboard/upcoming')
            setData(res.data)
        } catch {
            setError('Could not load dashboard. Is the backend running?')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const today = format(new Date(), 'EEEE, MMMM d, yyyy')

    // Today's counts come from the first day in the upcoming list
    const todayData = data?.days?.[0] ?? { breakfast: 0, lunch: 0, dinner: 0 }

    const mealRows = [
        { key: 'breakfast', label: 'Breakfast', emoji: '🌅', cls: 'breakfast' },
        { key: 'lunch', label: 'Lunch', emoji: '☀️', cls: 'lunch' },
        { key: 'dinner', label: 'Dinner', emoji: '🌙', cls: 'dinner' },
    ]

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
                        <CalendarCheck size={14} />
                        {today}
                    </div>
                </div>
                <button className="btn btn-outline" onClick={load} disabled={loading}>
                    <RefreshCw size={15} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <div className="spinner" />
                </div>
            )}

            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 12, padding: '1.25rem 1.5rem',
                    color: '#ef4444', fontSize: '0.9rem',
                }}>
                    ⚠️ {error}
                </div>
            )}

            {data && (
                <>
                    {/* Today's meal summary cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '1.25rem',
                        marginBottom: '2rem',
                    }}>
                        {mealRows.map(({ key, label, emoji, cls }) => {
                            const details = todayData[`${key}_details`] || [];
                            return (
                                <div key={key} className={`meal-card ${cls}`} 
                                    onClick={() => openModal(`Today's ${label}`, details)} 
                                    style={{ cursor: 'pointer' }}>
                                    <div className="meal-icon">{emoji}</div>
                                    <div className="meal-count">{todayData[key]}</div>
                                    <div className="meal-label">{label} — Today</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {todayData[key] === 1 ? '1 active customer' : `${todayData[key]} active customers`}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: `var(--${cls}-color, var(--primary))` }}>
                                        Click to view details &rarr;
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* 6-Day Upcoming Meals Table — only show days that have meals */}
                    {(() => {
                        const activeDays = data.days.filter(d => d.total > 0)
                        if (activeDays.length === 0) return (
                            <div className="card empty-state">
                                <div className="empty-icon">📅</div>
                                <p>No meals scheduled in the next 6 days.</p>
                            </div>
                        )
                        return (
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1rem 1.5rem 0.75rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                }}>
                                    <CalendarCheck size={16} color="var(--primary)" />
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Upcoming Meal Schedule</span>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                {/* First col: meal type label */}
                                                <th style={{
                                                    background: 'var(--bg-surface)',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.78rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                    padding: '0.85rem 1.25rem',
                                                    textAlign: 'left',
                                                    minWidth: 110,
                                                }}>
                                                    Meal
                                                </th>
                                                {activeDays.map((day, i) => {
                                                    const isToday = i === 0 && day.date === data.days[0].date
                                                    return (
                                                        <th key={day.date} style={{
                                                            background: isToday
                                                                ? 'rgba(22,163,74,0.12)'
                                                                : 'var(--bg-surface)',
                                                            color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                                                            fontSize: '0.78rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.06em',
                                                            padding: '0.85rem 1rem',
                                                            textAlign: 'center',
                                                            whiteSpace: 'nowrap',
                                                            borderLeft: '1px solid var(--border)',
                                                        }}>
                                                            <div style={{ fontWeight: 700 }}>
                                                                {isToday ? 'Today' : day.weekday}
                                                            </div>
                                                            <div style={{ fontWeight: 400, fontSize: '0.72rem', marginTop: '0.15rem', opacity: 0.8 }}>
                                                                {format(parseISO(day.date), 'MMM d')}
                                                            </div>
                                                        </th>
                                                    )
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mealRows.map(({ key, label, emoji, cls }) => (
                                                <tr key={key}>
                                                    <td style={{
                                                        padding: '0.9rem 1.25rem',
                                                        borderTop: '1px solid var(--border)',
                                                        fontWeight: 600,
                                                        fontSize: '0.88rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                    }}>
                                                        <span className={`badge badge-${cls}`} style={{ minWidth: 90, justifyContent: 'center' }}>
                                                            {emoji} {label}
                                                        </span>
                                                    </td>
                                                    {activeDays.map((day, i) => {
                                                        const isToday = i === 0 && day.date === data.days[0].date
                                                        const details = day[`${key}_details`] || []
                                                        return (
                                                            <td key={day.date} 
                                                                onClick={() => {
                                                                    if (day[key] > 0) openModal(`${day.weekday} (${format(parseISO(day.date), 'MMM d')}) - ${label}`, details)
                                                                }}
                                                                style={{
                                                                    padding: '0.9rem 1rem',
                                                                    borderTop: '1px solid var(--border)',
                                                                    borderLeft: '1px solid var(--border)',
                                                                    textAlign: 'center',
                                                                    fontSize: '1.1rem',
                                                                    fontWeight: 700,
                                                                    background: isToday ? 'rgba(22,163,74,0.04)' : 'transparent',
                                                                    color: isToday ? 'var(--text)' : 'var(--text-muted)',
                                                                    cursor: day[key] > 0 ? 'pointer' : 'default'
                                                            }}>
                                                                <div style={{ textDecoration: day[key] > 0 ? 'underline' : 'none', textUnderlineOffset: 4 }}>
                                                                    {day[key]}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}

                                            {/* Total row */}
                                            <tr style={{ background: 'var(--bg-surface)' }}>
                                                <td style={{
                                                    padding: '0.9rem 1.25rem',
                                                    borderTop: '2px solid var(--border)',
                                                    fontWeight: 700,
                                                    fontSize: '0.82rem',
                                                    color: 'var(--text-muted)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                }}>
                                                    Total
                                                </td>
                                                {activeDays.map((day, i) => {
                                                    const isToday = i === 0 && day.date === data.days[0].date
                                                    return (
                                                        <td key={day.date} style={{
                                                            padding: '0.9rem 1rem',
                                                            borderTop: '2px solid var(--border)',
                                                            borderLeft: '1px solid var(--border)',
                                                            textAlign: 'center',
                                                            fontSize: '1.3rem',
                                                            fontWeight: 800,
                                                            color: isToday ? 'var(--primary)' : 'var(--text)',
                                                        }}>
                                                            {day.total}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })()}

                    {/* Modal for Details */}
                    {modalOpen && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: '1rem'
                        }}>
                            <div className="card" style={{ maxWidth: 500, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                                <button className="btn btn-ghost" 
                                    style={{ position: 'absolute', top: 12, right: 12, padding: '0.4rem' }}
                                    onClick={() => setModalOpen(false)}>
                                    ✕
                                </button>
                                
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', paddingRight: '2rem' }}>
                                    {modalInfo.title}
                                </h2>
                                
                                {modalInfo.details.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                                        No customers scheduled for this meal.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {modalInfo.details.map((c, i) => (
                                            <div key={i} style={{ 
                                                border: '1px solid var(--border)', 
                                                borderRadius: 10, 
                                                padding: '1rem',
                                                background: 'var(--bg-surface)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.customer_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                                                    </div>
                                                    <span style={{ 
                                                        background: c.location_type === 'Office' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                                                        color: c.location_type === 'Office' ? '#3b82f6' : '#16a34a',
                                                        border: `1px solid ${c.location_type === 'Office' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`,
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: 12,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {c.location_type}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.4, marginTop: '0.5rem' }}>
                                                    {c.address ? c.address : <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>No address provided</span>}
                                                </div>
                                                {c.google_location && (
                                                    <div style={{ marginTop: '0.6rem' }}>
                                                        <a href={c.google_location} target="_blank" rel="noreferrer"
                                                            style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            📍 Open in Google Maps ↗
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
