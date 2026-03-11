import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateCustomer() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', phone: '', address: '', office_address: '', google_location: '', office_google_location: '' })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Name is required'
        if (!form.phone.trim()) e.phone = 'Phone is required'
        if (!form.address.trim()) e.address = 'Address is required'
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setLoading(true)
        try {
            await api.post('/customers/', form)
            toast.success('Customer created!')
            navigate('/customers')
        } catch {
            toast.error('Failed to create customer')
        } finally {
            setLoading(false)
        }
    }

    const field = (key) => ({
        className: 'form-input',
        value: form[key],
        onChange: e => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }) },
    })

    return (
        <div style={{ maxWidth: 520 }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/customers" className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="page-title">New Customer</h1>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input {...field('name')} placeholder="e.g. Ahmed Al-Rashid" />
                        {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input {...field('phone')} placeholder="+971 50 123 4567" />
                        {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Home Address *</label>
                        <textarea {...field('address')} rows={3} placeholder="Building, Street, City" style={{ resize: 'vertical' }} />
                        {errors.address && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.address}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Office Address (optional)</label>
                        <textarea {...field('office_address')} rows={2} placeholder="Building, Street, City" style={{ resize: 'vertical' }} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Home Google Location (optional)</label>
                        <input {...field('google_location')} placeholder="https://maps.google.com/?q=..." />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Office Google Location (optional)</label>
                        <input {...field('office_google_location')} placeholder="https://maps.google.com/?q=..." />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={15} />
                            {loading ? 'Saving…' : 'Save Customer'}
                        </button>
                        <Link to="/customers" className="btn btn-outline">Cancel</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
