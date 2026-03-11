import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Plus } from 'lucide-react'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/customers/new', icon: Plus, label: 'New' },
]

export default function BottomNav() {
    return (
        <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            zIndex: 100,
            padding: '0.4rem 0 0.6rem',
        }}>
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.2rem',
                    textDecoration: 'none', padding: '0.4rem',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.68rem', fontWeight: 600,
                    transition: 'color 0.2s',
                })}>
                    <Icon size={22} />
                    {label}
                </NavLink>
            ))}
        </nav>
    )
}
