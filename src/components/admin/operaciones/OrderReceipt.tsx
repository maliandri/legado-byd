'use client'

import { forwardRef } from 'react'
import type { Order } from '@/types'

interface Props {
  order: Order
}

const ESTADOS: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

function ReciboCuerpo({ order, copia }: { order: Order; copia: 'CLIENTE' | 'LEGADO' }) {
  const fecha = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

  return (
    <div className="recibo-cuerpo">
      {/* Header */}
      <div className="recibo-header">
        <div className="recibo-logo-area">
          <div className="recibo-logo-icon">⚙</div>
          <div>
            <div className="recibo-marca">LEGADO</div>
            <div className="recibo-submarca">El almacén del panadero</div>
            <div className="recibo-contacto">legadobyd.com · Neuquén, Argentina</div>
          </div>
        </div>
        <div className="recibo-doc-info">
          <div className="recibo-tipo">REMITO DE ENTREGA</div>
          <div className="recibo-copia-label">Copia: {copia}</div>
          <div className="recibo-nro">N° {order.id.slice(-8).toUpperCase()}</div>
          <div className="recibo-fecha">Fecha: {fecha}</div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="recibo-seccion">
        <div className="recibo-seccion-titulo">DATOS DEL CLIENTE</div>
        <div className="recibo-grid-2">
          <div>
            <span className="recibo-label">Nombre:</span>
            <span className="recibo-valor">{order.nombre_cliente || '________________________'}</span>
          </div>
          <div>
            <span className="recibo-label">DNI:</span>
            <span className="recibo-valor">________________________</span>
          </div>
          <div>
            <span className="recibo-label">Email:</span>
            <span className="recibo-valor">{order.email_cliente || '________________________'}</span>
          </div>
          <div>
            <span className="recibo-label">Teléfono:</span>
            <span className="recibo-valor">________________________</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="recibo-seccion">
        <div className="recibo-seccion-titulo">DETALLE DE PRODUCTOS</div>
        <table className="recibo-tabla">
          <thead>
            <tr>
              <th className="recibo-th recibo-th-prod">PRODUCTO</th>
              <th className="recibo-th recibo-th-num">CANT.</th>
              <th className="recibo-th recibo-th-num">P. UNIT.</th>
              <th className="recibo-th recibo-th-num">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'recibo-tr-par' : ''}>
                <td className="recibo-td">{item.nombre}</td>
                <td className="recibo-td recibo-td-num">{item.cantidad}</td>
                <td className="recibo-td recibo-td-num">${item.precio.toLocaleString('es-AR')}</td>
                <td className="recibo-td recibo-td-num">${(item.precio * item.cantidad).toLocaleString('es-AR')}</td>
              </tr>
            ))}
            {/* Filas vacías para llenar a mano si es necesario */}
            {Array.from({ length: Math.max(0, 3 - order.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="recibo-td recibo-td-empty">&nbsp;</td>
                <td className="recibo-td recibo-td-num recibo-td-empty">&nbsp;</td>
                <td className="recibo-td recibo-td-num recibo-td-empty">&nbsp;</td>
                <td className="recibo-td recibo-td-num recibo-td-empty">&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="recibo-total-label">TOTAL</td>
              <td className="recibo-total-valor">${order.monto_total.toLocaleString('es-AR')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Logística */}
      <div className="recibo-seccion recibo-grid-2">
        <div>
          <span className="recibo-label">Cantidad de bultos:</span>
          <span className="recibo-linea-vacia" />
        </div>
        <div>
          <span className="recibo-label">Estado:</span>
          <span className="recibo-valor">{ESTADOS[order.estado] || order.estado}</span>
        </div>
      </div>

      {/* Firmas */}
      <div className="recibo-firmas">
        <div className="recibo-firma-bloque">
          <div className="recibo-firma-espacio" />
          <div className="recibo-firma-linea" />
          <div className="recibo-firma-label">Recibí conforme</div>
          <div className="recibo-firma-sub">Aclaración: ___________________ DNI: ___________</div>
        </div>
        <div className="recibo-firma-bloque">
          <div className="recibo-firma-espacio" />
          <div className="recibo-firma-linea" />
          <div className="recibo-firma-label">Entregado por Legado ByD</div>
          <div className="recibo-firma-sub">Aclaración: ___________________ </div>
        </div>
      </div>
    </div>
  )
}

const OrderReceipt = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  return (
    <div ref={ref} className="recibo-wrapper">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .recibo-wrapper, .recibo-wrapper * { visibility: visible !important; }
          .recibo-wrapper { position: fixed; inset: 0; background: white; }
          @page { size: A4 portrait; margin: 10mm; }
        }
        .recibo-wrapper {
          font-family: 'Arial', sans-serif;
          background: white;
          color: #000;
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
        }
        .recibo-cuerpo {
          border: 2px solid #000;
          padding: 14px 18px;
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        .recibo-separador {
          border-top: 2px dashed #000;
          margin: 4px 0 8px;
          text-align: center;
          font-size: 9px;
          color: #555;
          letter-spacing: 2px;
        }
        .recibo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .recibo-logo-area { display: flex; align-items: center; gap: 10px; }
        .recibo-logo-icon { font-size: 2rem; }
        .recibo-marca { font-size: 1.3rem; font-weight: 900; letter-spacing: 0.15em; }
        .recibo-submarca { font-size: 0.7rem; font-style: italic; }
        .recibo-contacto { font-size: 0.65rem; color: #555; margin-top: 2px; }
        .recibo-doc-info { text-align: right; }
        .recibo-tipo { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; }
        .recibo-copia-label { font-size: 0.7rem; background: #000; color: #fff; padding: 1px 6px; display: inline-block; margin: 2px 0; }
        .recibo-nro { font-size: 0.9rem; font-weight: 700; font-family: monospace; }
        .recibo-fecha { font-size: 0.72rem; }
        .recibo-seccion { margin-bottom: 10px; }
        .recibo-seccion-titulo { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; border-bottom: 1px solid #000; margin-bottom: 6px; padding-bottom: 2px; }
        .recibo-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 0.75rem; }
        .recibo-label { font-weight: 700; margin-right: 4px; }
        .recibo-valor { }
        .recibo-linea-vacia { display: inline-block; border-bottom: 1px solid #000; width: 80px; }
        .recibo-tabla { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
        .recibo-th { background: #000; color: #fff; padding: 4px 6px; font-size: 0.65rem; letter-spacing: 0.05em; }
        .recibo-th-prod { text-align: left; width: 55%; }
        .recibo-th-num { text-align: right; width: 15%; }
        .recibo-td { padding: 3px 6px; border-bottom: 1px solid #ddd; }
        .recibo-td-num { text-align: right; }
        .recibo-td-empty { height: 18px; }
        .recibo-tr-par { background: #f5f5f5; }
        .recibo-total-label { padding: 5px 6px; text-align: right; font-weight: 700; font-size: 0.78rem; border-top: 2px solid #000; }
        .recibo-total-valor { padding: 5px 6px; text-align: right; font-weight: 900; font-size: 0.9rem; border-top: 2px solid #000; }
        .recibo-firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
        .recibo-firma-bloque { }
        .recibo-firma-espacio { height: 40px; }
        .recibo-firma-linea { border-top: 1px solid #000; }
        .recibo-firma-label { font-size: 0.72rem; font-weight: 700; margin-top: 3px; }
        .recibo-firma-sub { font-size: 0.65rem; color: #444; margin-top: 2px; }
      `}</style>

      {/* Copia Cliente */}
      <ReciboCuerpo order={order} copia="CLIENTE" />

      {/* Línea de corte */}
      <div className="recibo-separador">✂ &nbsp; CORTAR POR AQUÍ &nbsp; ✂</div>

      {/* Copia Legado */}
      <ReciboCuerpo order={order} copia="LEGADO" />
    </div>
  )
})

OrderReceipt.displayName = 'OrderReceipt'
export default OrderReceipt
