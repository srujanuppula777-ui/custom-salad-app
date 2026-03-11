import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Plus, Salad } from 'lucide-react'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/customers/new', icon: Plus, label: 'New Customer' },
]

export default function Sidebar() {
    return (
        <aside style={{
            width: 240,
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem',
            gap: '0.35rem',
            flexShrink: 0,
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Salad size={20} color="#fff" />
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>Custom</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', lineHeight: 1.1 }}>Salad</div>
                </div>
            </div>

            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.9rem', borderRadius: 10,
                    textDecoration: 'none',
                    fontWeight: 600, fontSize: '0.9rem',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    boxShadow: isActive ? '0 2px 12px rgba(22,163,74,0.35)' : 'none',
                    transition: 'all 0.2s',
                })}>
                    <Icon size={18} />
                    {label}
                </NavLink>
            ))}
        </aside>
    )
}
