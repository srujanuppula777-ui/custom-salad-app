import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import { ArrowLeft, CalendarDays, Save, PauseCircle } from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'

const SVC_META = {
    breakfast: { label: 'Breakfast', emoji: '🌅', cls: 'breakfast', color: '#f59e0b' },
    lunch: { label: 'Lunch', emoji: '☀️', cls: 'lunch', color: '#16a34a' },
    dinner: { label: 'Dinner', emoji: '🌙', cls: 'dinner', color: '#6366f1' },
}

const QUICK_DAYS = [5, 20]
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function generateDates(start, end, schedulePayload) {
    const dates = []
    let cur = new Date(start)
    const endD = new Date(end)
    while (cur <= endD) {
        const wd = WEEKDAYS[cur.getDay()]
        if (schedulePayload[wd]) dates.push(new Date(cur))
        cur = addDays(cur, 1)
    }
    return dates
}

function applyQuickDays(start, numDays, schedulePayload) {
    let count = 0
    let cur = new Date(start)
    if (Object.keys(schedulePayload).length === 0) return cur
    while (count < numDays) {
        const wd = WEEKDAYS[cur.getDay()]
        if (schedulePayload[wd]) count++
        if (count < numDays) cur = addDays(cur, 1)
    }
    return cur
}

function extendEndDateByValidDays(endDateStr, pauseCount, schedulePayload) {
    if (!pauseCount) return endDateStr;
    if (Object.keys(schedulePayload).length === 0) return endDateStr;
    let cur = new Date(endDateStr + 'T00:00:00');
    let added = 0;
    while (added < pauseCount) {
        cur = addDays(cur, 1);
        const wd = WEEKDAYS[cur.getDay()];
        if (schedulePayload[wd]) added++;
    }
    return format(cur, 'yyyy-MM-dd');
}

export default function Subscribe() {
    const { id, service, subId } = useParams()
    const navigate = useNavigate()
    const isEdit = !!subId
    const [customer, setCustomer] = useState(null)
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'))
    
    const AVAILABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const [selectedDays, setSelectedDays] = useState(new Set(AVAILABLE_DAYS))
    const [locations, setLocations] = useState({
        Monday: 'Home', Tuesday: 'Home', Wednesday: 'Home', Thursday: 'Home', Friday: 'Home'
    })
    
    // schedule payload for backend / calculations
    const schedulePayload = Object.fromEntries(
        Array.from(selectedDays).map(d => [d, locations[d] || 'Home'])
    )

    const [quickDays, setQuickDays] = useState(null)
    const [pausedDates, setPausedDates] = useState(new Set())
    const [saving, setSaving] = useState(false)
    const [currentService, setCurrentService] = useState(service)

    useEffect(() => {
        api.get(`/customers/${id}`).then(r => setCustomer(r.data)).catch(() => toast.error('Customer not found'))
        
        if (isEdit) {
            api.get(`/subscriptions/customer/${id}`).then(r => {
                const sub = r.data.find(s => s.id === parseInt(subId))
                if (sub) {
                    setCurrentService(sub.service_type)
                    setStartDate(sub.start_date)
                    // Note: sub.end_date in DB is already adjusted. 
                    setEndDate(sub.end_date)
                    
                    if (sub.delivery_schedule) {
                        const days = Object.keys(sub.delivery_schedule)
                        setSelectedDays(new Set(days))
                        setLocations(prev => ({ ...prev, ...sub.delivery_schedule }))
                    } else if (sub.day_type === 'weekdays') {
                        setSelectedDays(new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']))
                    }
                    
                    setPausedDates(new Set(sub.pause_dates || []))
                    setQuickDays(null)
                }
            }).catch(() => toast.error('Subscription not found'))
        }
    }, [id, subId, isEdit])

    // Clear paused dates when range/schedule changes (ONLY IF NOT EDITING or if dates changed manually)
    // Actually, this useEffect is annoying for editing.
    // I'll change it to only trigger if the values actually changed from what was loaded.
    // For now, I'll just disable this "auto-clear" during edit initialization.

    const applyQuick = (n) => {
        setQuickDays(n)
        if (n) {
            const end = applyQuickDays(new Date(startDate + 'T00:00:00'), n, schedulePayload)
            setEndDate(format(end, 'yyyy-MM-dd'))
        }
    }

    // When the user changes selected days (schedule payload changes), if quickDays is active, recalculate endDate.
    useEffect(() => {
        if (quickDays !== null) {
            applyQuick(quickDays)
        }
    }, [schedulePayload, startDate, quickDays])

    // Original service dates (before pause extension)
    const originalDates = endDate >= startDate && Object.keys(schedulePayload).length > 0
        ? generateDates(new Date(startDate + 'T00:00:00'), new Date(endDate + 'T00:00:00'), schedulePayload)
        : []

    // Adjusted end date = endDate + number of paused days (valid days)
    const adjustedEnd = extendEndDateByValidDays(endDate, pausedDates.size, schedulePayload)

    // Generate all dates including the extended ones for the preview
    const extendedDates = adjustedEnd >= startDate && Object.keys(schedulePayload).length > 0
        ? generateDates(new Date(startDate + 'T00:00:00'), new Date(adjustedEnd + 'T00:00:00'), schedulePayload)
        : []

    // Active service days = extended dates minus paused ones
    const activeDates = extendedDates.filter(d => !pausedDates.has(format(d, 'yyyy-MM-dd')))

    const homeDates = activeDates.filter(d => schedulePayload[WEEKDAYS[d.getDay()]] === 'Home')
    const officeDates = activeDates.filter(d => schedulePayload[WEEKDAYS[d.getDay()]] === 'Office')

    const togglePause = (dateStr) => {
        setPausedDates(prev => {
            const next = new Set(prev)
            if (next.has(dateStr)) next.delete(dateStr)
            else next.add(dateStr)
            return next
        })
    }

    const meta = SVC_META[currentService] || SVC_META.lunch

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!startDate || !endDate || endDate < startDate) { toast.error('Invalid date range'); return }
        if (Object.keys(schedulePayload).length === 0) { toast.error('Please select at least one delivery day'); return }
        setSaving(true)
        try {
            const payload = {
                customer_id: parseInt(id),
                service_type: currentService,
                start_date: startDate,
                end_date: endDate,
                delivery_schedule: schedulePayload,
                pause_dates: Array.from(pausedDates),
            }
            
            if (isEdit) {
                await api.patch(`/subscriptions/${subId}`, payload)
                toast.success('Subscription updated!')
            } else {
                await api.post('/subscriptions/', payload)
                toast.success(`${meta.label} subscription saved! (${activeDates.length} active days${pausedDates.size > 0 ? `, ${pausedDates.size} paused` : ''})`)
            }
            navigate(`/customers/${id}`)
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save subscription')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ maxWidth: 560 }}>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to={`/customers/${id}`} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.3rem' }}>
                            {meta.emoji} {meta.label} Subscription
                        </h1>
                        {customer && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>for {customer.name}</div>}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Step 1: Date range ── */}
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <CalendarDays size={15} /> Step 1 — Date Range
                    </div>

                    {/* Quick days buttons */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Quick Select</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {QUICK_DAYS.map(n => (
                                <button type="button" key={n}
                                    className={`btn ${quickDays === n ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                                    onClick={() => applyQuick(n)}>
                                    {n} days
                                </button>
                            ))}
                            <button type="button" className={`btn ${quickDays === null ? 'btn-primary' : 'btn-outline'}`}
                                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                                onClick={() => setQuickDays(null)}>
                                Custom
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Start Date</label>
                            <input type="date" className="form-input" value={startDate} onChange={e => { setStartDate(e.target.value); setQuickDays(null) }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">End Date</label>
                            <input type="date" className="form-input" value={endDate} onChange={e => { setEndDate(e.target.value); setQuickDays(null) }} min={startDate} />
                        </div>
                    </div>
                </div>

                {/* ── Step 2: Delivery Schedule ── */}
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Step 2 — Delivery Schedule
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {AVAILABLE_DAYS.map(day => {
                            const isSelected = selectedDays.has(day)
                            const toggleDay = () => {
                                setSelectedDays(prev => {
                                    const next = new Set(prev)
                                    if (next.has(day)) next.delete(day)
                                    else next.add(day)
                                    return next
                                })
                            }
                            return (
                                <div key={day} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', borderRadius: 10,
                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                    background: isSelected ? 'rgba(22,163,74,0.06)' : 'var(--bg-surface)',
                                    transition: 'all 0.2s',
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}>
                                        <input type="checkbox" checked={isSelected} onChange={toggleDay}
                                            style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? 'var(--text)' : 'var(--text-muted)' }}>{day}</span>
                                    </label>
                                    
                                    {isSelected && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {['Home', 'Office'].map(loc => (
                                                <button type="button" key={loc}
                                                    onClick={() => setLocations(prev => ({ ...prev, [day]: loc }))}
                                                    style={{
                                                        padding: '0.25rem 0.6rem',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        border: `1px solid ${locations[day] === loc ? `var(--${loc.toLowerCase()}-color, var(--primary))` : 'var(--border)'}`,
                                                        background: locations[day] === loc ? `var(--${loc.toLowerCase()}-bg, rgba(22,163,74,0.1))` : 'transparent',
                                                        color: locations[day] === loc ? `var(--${loc.toLowerCase()}-text, var(--primary))` : 'var(--text-muted)',
                                                    }}>
                                                    {loc}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── Step 3: Pause Dates ── */}
                {originalDates.length > 0 && (
                    <div className="card" style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <PauseCircle size={15} /> Step 3 — Pause Dates (optional)
                            </div>
                            {pausedDates.size > 0 && (
                                <button type="button" className="btn btn-ghost"
                                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                                    onClick={() => setPausedDates(new Set())}>
                                    Clear all
                                </button>
                            )}
                        </div>

                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                            Click dates to pause them. Paused days are skipped and added to the end of your subscription automatically.
                        </p>

                        {pausedDates.size > 0 && (
                            <div style={{
                                background: 'rgba(249,115,22,0.08)',
                                border: '1px solid rgba(249,115,22,0.25)',
                                borderRadius: 10, padding: '0.65rem 1rem',
                                fontSize: '0.82rem', marginBottom: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                <PauseCircle size={14} color="#f97316" />
                                <span>
                                    <strong style={{ color: '#f97316' }}>{pausedDates.size} day{pausedDates.size > 1 ? 's' : ''} paused</strong>
                                    {' '}— new end date:{' '}
                                    <strong style={{ color: 'var(--primary)' }}>{format(parseISO(adjustedEnd), 'EEE, MMM d, yyyy')}</strong>
                                </span>
                            </div>
                        )}

                        <div className="date-grid">
                            {originalDates.map(d => {
                                const ds = format(d, 'yyyy-MM-dd')
                                const isPaused = pausedDates.has(ds)
                                return (
                                    <button
                                        key={ds}
                                        type="button"
                                        onClick={() => togglePause(ds)}
                                        style={{
                                            background: isPaused ? 'rgba(249,115,22,0.15)' : 'rgba(22,163,74,0.1)',
                                            border: `1px solid ${isPaused ? 'rgba(249,115,22,0.4)' : 'rgba(22,163,74,0.25)'}`,
                                            color: isPaused ? '#f97316' : 'var(--primary-light)',
                                            padding: '0.35rem 0.6rem',
                                            borderRadius: 8,
                                            fontSize: '0.78rem',
                                            fontWeight: 500,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            textDecoration: isPaused ? 'line-through' : 'none',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {format(d, 'EEE, MMM d')}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── Preview ── */}
                {activeDates.length > 0 && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Active Service Days Preview</span>
                            <span className={`badge badge-${meta.cls}`}>{activeDates.length} days</span>
                        </div>
                        {pausedDates.size > 0 && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                End date extended to <strong style={{ color: 'var(--primary)' }}>{format(parseISO(adjustedEnd), 'MMM d, yyyy')}</strong>
                            </div>
                        )}
                        
                        {homeDates.length > 0 && (
                            <div style={{ marginBottom: officeDates.length > 0 ? '1rem' : 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏠 Home Delivery ({homeDates.length})
                                </div>
                                <div className="date-grid">
                                    {homeDates.map(d => (
                                        <div key={d.toISOString()} className="date-chip">
                                            {format(d, 'EEE, MMM d')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {officeDates.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏢 Office Delivery ({officeDates.length})
                                </div>
                                <div className="date-grid">
                                    {officeDates.map(d => (
                                        <div key={d.toISOString()} className="date-chip">
                                            {format(d, 'EEE, MMM d')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit */}
                <button type="submit" className="btn btn-primary" disabled={saving || activeDates.length === 0}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                    <Save size={16} />
                    {saving ? 'Saving…' : isEdit ? 'Update Subscription' : `Save ${meta.label} Subscription (${activeDates.length} active days)`}
                </button>
            </form>
        </div>
    )
}
