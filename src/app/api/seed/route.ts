import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Solo disponible en desarrollo
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
  }

  // Init Firebase Admin con Client credentials (modo prueba no necesita service account)
  // Usamos REST directamente para evitar necesitar service account
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!

  const categorias = [
    { id: 'panaderia',  nombre: 'Panadería',  slug: 'panaderia',  emoji: '🍞' },
    { id: 'pasteleria', nombre: 'Pastelería', slug: 'pasteleria', emoji: '🎂' },
    { id: 'decoracion', nombre: 'Decoración', slug: 'decoracion', emoji: '✨' },
  ]

  const productos = [
    { nombre: 'Harina 000', descripcion: 'Harina de trigo triple cero, ideal para pan artesanal. Bolsa de 25kg.', precio: 18500, categoria: 'panaderia', stock: true, imagen: '' },
    { nombre: 'Harina 0000', descripcion: 'Harina extra fina para pastelería fina y repostería. Bolsa de 25kg.', precio: 21000, categoria: 'pasteleria', stock: true, imagen: '' },
    { nombre: 'Levadura seca', descripcion: 'Levadura instantánea de alta tolerancia. Sobre de 500g.', precio: 4200, categoria: 'panaderia', stock: true, imagen: '' },
    { nombre: 'Azúcar impalpable', descripcion: 'Azúcar glasé ultrafina para decoraciones y coberturas. 1kg.', precio: 3800, categoria: 'pasteleria', stock: true, imagen: '' },
    { nombre: 'Manga pastelera', descripcion: 'Manga reutilizable con 12 boquillas intercambiables. Set completo.', precio: 6500, categoria: 'decoracion', stock: true, imagen: '' },
    { nombre: 'Colorante en gel', descripcion: 'Set de 12 colorantes en gel concentrado para repostería. Colores vivos y estables.', precio: 8900, categoria: 'decoracion', stock: true, imagen: '' },
    { nombre: 'Cacao amargo', descripcion: 'Cacao puro en polvo sin azúcar, proceso holandés. 1kg.', precio: 7200, categoria: 'pasteleria', stock: true, imagen: '' },
    { nombre: 'Sal fina', descripcion: 'Sal de panadería refinada. Bolsa de 5kg.', precio: 1800, categoria: 'panaderia', stock: false, imagen: '' },
  ]

  const results: string[] = []

  // Usamos Firestore REST API directamente
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!

  // Crear categorías
  for (const cat of categorias) {
    const url = `${baseUrl}/categorias/${cat.id}?key=${apiKey}`
    const body = {
      fields: {
        nombre:  { stringValue: cat.nombre },
        slug:    { stringValue: cat.slug },
        emoji:   { stringValue: cat.emoji },
      }
    }
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) results.push(`✓ Categoría: ${cat.nombre}`)
    else results.push(`✗ Error categoría ${cat.nombre}: ${await res.text()}`)
  }

  // Crear productos
  for (const prod of productos) {
    const url = `${baseUrl}/productos?key=${apiKey}`
    const now = new Date().toISOString()
    const body = {
      fields: {
        nombre:      { stringValue: prod.nombre },
        descripcion: { stringValue: prod.descripcion },
        precio:      { integerValue: prod.precio },
        categoria:   { stringValue: prod.categoria },
        stock:       { booleanValue: prod.stock },
        imagen:      { stringValue: prod.imagen },
        createdAt:   { timestampValue: now },
        updatedAt:   { timestampValue: now },
      }
    }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) results.push(`✓ Producto: ${prod.nombre}`)
    else results.push(`✗ Error producto ${prod.nombre}: ${await res.text()}`)
  }

  return NextResponse.json({ ok: true, resultados: results })
}
