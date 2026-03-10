'use client'

interface Categoria {
  slug: string
  nombre: string
  emoji: string
}

interface Props {
  categorias: Categoria[]
  activa: string | null
  onChange: (slug: string | null) => void
}

export default function CategoryFilter({ categorias, activa, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onChange(null)}
        className="px-5 py-2 rounded-sm text-sm font-semibold transition-all"
        style={
          activa === null
            ? { backgroundColor: '#3D1A05', color: '#F2E6C8', border: '1px solid #3D1A05' }
            : { backgroundColor: 'transparent', color: '#6B3A1A', border: '1px solid #DDD0A8' }
        }
      >
        Todos
      </button>

      {categorias.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onChange(cat.slug)}
          className="px-5 py-2 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5"
          style={
            activa === cat.slug
              ? { backgroundColor: '#3D1A05', color: '#F2E6C8', border: '1px solid #3D1A05' }
              : { backgroundColor: 'transparent', color: '#6B3A1A', border: '1px solid #DDD0A8' }
          }
        >
          <span>{cat.emoji}</span>
          <span>{cat.nombre}</span>
        </button>
      ))}
    </div>
  )
}
