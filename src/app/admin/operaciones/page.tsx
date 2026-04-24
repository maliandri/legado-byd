import AdminGuard from '@/components/admin/AdminGuard'
import OperacionesPanel from '@/components/admin/operaciones/OperacionesPanel'

export default function OperacionesPage() {
  return (
    <AdminGuard>
      <div style={{ minHeight: '100vh', backgroundColor: '#F9EDD3' }}>
        <header style={{ backgroundColor: '#3D1A05', borderBottom: '3px solid #C4A040', padding: '12px 24px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontSize: '1.2rem', fontWeight: 700 }}>
            Legado ByD — Operaciones
          </h1>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
          <OperacionesPanel />
        </main>
      </div>
    </AdminGuard>
  )
}
