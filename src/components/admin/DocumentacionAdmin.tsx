'use client'

import { Download } from 'lucide-react'

export default function DocumentacionAdmin() {
  function descargarWord() {
    const html = generarHTML()
    const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Legado-ByD-Documentacion.doc'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0' }}>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700 }}>
            Documentación del Sistema
          </h2>
          <p style={{ color: '#A0622A', fontSize: '0.85rem', marginTop: 4 }}>
            Manual completo de uso del panel de administración y el sitio Legado Bazar y Deco.
          </p>
        </div>
        <button
          onClick={descargarWord}
          className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-sm hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ backgroundColor: '#1A3A6A', color: '#fff' }}
        >
          <Download size={15} />
          Descargar Word
        </button>
      </div>

      {/* Vista previa del índice */}
      <div className="rounded-sm p-5" style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
        <p style={{ color: '#6B3A1A', fontWeight: 700, fontSize: '0.85rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Contenido del documento
        </p>
        <ol style={{ color: '#3D1A05', fontSize: '0.9rem', lineHeight: 2, paddingLeft: 20 }}>
          <li>Introducción y acceso al sistema</li>
          <li>Roles de usuario (Cliente, Empresa, Vendedor, Admin)</li>
          <li>Catálogo público — navegación y filtros</li>
          <li>Carrito de compras y pedidos</li>
          <li>Portal del cliente — Mi cuenta</li>
          <li>Panel de Vendedor — Punto de venta</li>
          <li>Panel Admin — Productos</li>
          <li>Panel Admin — Categorías</li>
          <li>Panel Admin — Emails masivos</li>
          <li>Panel Admin — Usuarios</li>
          <li>Panel Admin — Operaciones</li>
          <li>Panel Admin — Publicación Libre (redes sociales)</li>
          <li>Panel Admin — Creador de Reels</li>
          <li>Panel Admin — Nosotros</li>
          <li>Panel Admin — Legado Social (feed)</li>
          <li>Panel Admin — Panfletín con QR</li>
          <li>Panel Admin — Documentación</li>
          <li>Integraciones externas (Instagram, Make.com, Google Sheets)</li>
          <li>Preguntas frecuentes y solución de problemas</li>
        </ol>
      </div>
    </div>
  )
}

function generarHTML(): string {
  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Legado Bazar y Deco — Documentación del Sistema</title>
<style>
  body {
    font-family: Calibri, Arial, sans-serif;
    font-size: 11pt;
    color: #222222;
    margin: 2cm 2.5cm;
    line-height: 1.6;
  }
  h1 {
    font-family: Georgia, serif;
    font-size: 22pt;
    color: #3D1A05;
    border-bottom: 3pt solid #C4A040;
    padding-bottom: 6pt;
    margin-top: 0;
    page-break-before: always;
  }
  h1.portada { page-break-before: avoid; }
  h2 {
    font-family: Georgia, serif;
    font-size: 15pt;
    color: #3D1A05;
    margin-top: 18pt;
    margin-bottom: 6pt;
    border-left: 4pt solid #C4A040;
    padding-left: 8pt;
  }
  h3 {
    font-size: 12pt;
    color: #6B3A1A;
    margin-top: 14pt;
    margin-bottom: 4pt;
    font-weight: bold;
  }
  p { margin: 6pt 0; }
  ul, ol { margin: 6pt 0 10pt 20pt; }
  li { margin-bottom: 4pt; }
  .nota {
    background: #FFF3CD;
    border-left: 4pt solid #C4A040;
    padding: 8pt 12pt;
    margin: 10pt 0;
    font-size: 10pt;
  }
  .alerta {
    background: #F8D7DA;
    border-left: 4pt solid #B91C1C;
    padding: 8pt 12pt;
    margin: 10pt 0;
    font-size: 10pt;
  }
  .tip {
    background: #D4EDDA;
    border-left: 4pt solid #4A5E1A;
    padding: 8pt 12pt;
    margin: 10pt 0;
    font-size: 10pt;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 10pt 0;
    font-size: 10pt;
  }
  th {
    background-color: #3D1A05;
    color: #F2E6C8;
    padding: 6pt 8pt;
    text-align: left;
    font-weight: bold;
  }
  td {
    padding: 5pt 8pt;
    border: 1pt solid #DDD0A8;
  }
  tr:nth-child(even) td { background-color: #F9EDD3; }
  .portada-sub {
    font-size: 13pt;
    color: #6B3A1A;
    margin-top: 8pt;
  }
  .portada-info {
    margin-top: 30pt;
    font-size: 10pt;
    color: #888;
  }
  code {
    font-family: Courier New, monospace;
    font-size: 10pt;
    background: #F2E6C8;
    padding: 1pt 4pt;
    border-radius: 2pt;
  }
</style>
</head>
<body>

<!-- PORTADA -->
<h1 class="portada" style="border:none; text-align:center; font-size:28pt; margin-top:80pt;">
  Legado Bazar y Deco
</h1>
<p style="text-align:center;" class="portada-sub">
  Manual de Usuario y Administración del Sistema
</p>
<p style="text-align:center; margin-top:20pt; color:#A0622A; font-size:11pt;">
  Insumos para panaderos, pasteleros y decoradores<br>
  Neuquén, Argentina
</p>
<p style="text-align:center;" class="portada-info">
  Sitio web: https://legadobyd.com<br>
  Versión del documento: Mayo 2026
</p>

<!-- ÍNDICE -->
<h1>Índice</h1>
<ol style="line-height:2.2;">
  <li>Introducción y acceso al sistema</li>
  <li>Roles de usuario</li>
  <li>Catálogo público</li>
  <li>Carrito de compras y pedidos</li>
  <li>Portal del cliente — Mi cuenta</li>
  <li>Panel de Vendedor — Punto de venta</li>
  <li>Panel Admin — Productos</li>
  <li>Panel Admin — Categorías</li>
  <li>Panel Admin — Emails masivos</li>
  <li>Panel Admin — Usuarios</li>
  <li>Panel Admin — Operaciones</li>
  <li>Panel Admin — Publicación Libre</li>
  <li>Panel Admin — Creador de Reels</li>
  <li>Panel Admin — Nosotros</li>
  <li>Panel Admin — Legado Social</li>
  <li>Panel Admin — Panfletín con QR</li>
  <li>Integraciones externas</li>
  <li>Preguntas frecuentes y solución de problemas</li>
</ol>

<!-- 1 -->
<h1>1. Introducción y acceso al sistema</h1>

<h2>¿Qué es este sistema?</h2>
<p>
  Legado Bazar y Deco cuenta con un sitio web completo que incluye catálogo de productos, sistema de pedidos,
  panel de administración, punto de venta para vendedores y portal para clientes. El sitio está disponible en
  <strong>https://legadobyd.com</strong>.
</p>

<h2>Cómo iniciar sesión</h2>
<p>Accedé a la página principal y hacé clic en <strong>Iniciar sesión</strong>. Hay dos formas de acceso:</p>
<ul>
  <li><strong>Google:</strong> Hacé clic en "Continuar con Google" y elegí tu cuenta de Gmail.</li>
  <li><strong>Email y contraseña:</strong> Ingresá tu correo electrónico y contraseña registrados.</li>
</ul>

<div class="nota">
  <strong>Nota:</strong> En dispositivos móviles, si el popup de Google está bloqueado, el sistema redirige
  automáticamente a la pantalla de login de Google y vuelve al sitio al completar el acceso.
</div>

<h2>Primer acceso — Registro de cuenta</h2>
<p>Si es la primera vez que ingresás, el sistema te guía por 3 pasos:</p>
<ol>
  <li><strong>Paso 1:</strong> Elegís si sos Cliente particular o Empresa.</li>
  <li><strong>Paso 2:</strong> Completás tus datos personales (nombre, teléfono, dirección, DNI o CUIT).
      El sistema envía un código de verificación a tu email.</li>
  <li><strong>Paso 3:</strong> Ingresás el código de 6 dígitos para verificar tu identidad.
      Una vez verificado, recibís un email de bienvenida y accedés a tu cuenta.</li>
</ol>

<h2>Recuperar contraseña</h2>
<p>En la pantalla de login, hacé clic en <strong>"¿Olvidaste tu contraseña?"</strong> e ingresá tu email.
Recibirás un correo con el enlace para restablecerla.</p>

<!-- 2 -->
<h1>2. Roles de usuario</h1>

<p>El sistema maneja cuatro tipos de usuario con diferentes permisos y vistas:</p>

<table>
  <tr>
    <th>Rol</th>
    <th>Qué puede hacer</th>
    <th>Dónde accede</th>
  </tr>
  <tr>
    <td><strong>Cliente</strong></td>
    <td>Ver catálogo, agregar al carrito, hacer pedidos, ver historial, comentar en el feed social</td>
    <td>/mi-cuenta</td>
  </tr>
  <tr>
    <td><strong>Empresa</strong></td>
    <td>Igual que Cliente pero con datos de empresa (CUIT, razón social)</td>
    <td>/mi-cuenta</td>
  </tr>
  <tr>
    <td><strong>Vendedor</strong></td>
    <td>Todo lo anterior + acceso al Punto de Venta para crear pedidos manuales</td>
    <td>/vendedor</td>
  </tr>
  <tr>
    <td><strong>Admin</strong></td>
    <td>Acceso completo al panel de administración. Gestión total del sistema.</td>
    <td>/admin</td>
  </tr>
</table>

<div class="tip">
  <strong>Tip:</strong> Los usuarios con rol Vendedor ven un badge "Vendedor" azul en Mi Cuenta
  y un botón "Punto de venta" que los lleva directamente al panel de ventas.
</div>

<!-- 3 -->
<h1>3. Catálogo público</h1>

<h2>¿Qué es el catálogo?</h2>
<p>
  El catálogo es la sección principal del sitio donde todos los visitantes pueden ver los productos
  disponibles. No es necesario estar registrado para verlo.
</p>

<h2>Navegación por el catálogo</h2>
<ul>
  <li>La barra de navegación superior tiene tres enlaces fijos: <strong>Nosotros</strong>,
      <strong>Legado Social</strong> y <strong>Catálogo</strong>.</li>
  <li>Dentro del catálogo podés filtrar por categoría usando las tarjetas de categoría o el buscador.</li>
  <li>Podés cambiar entre <strong>vista lista</strong> y <strong>vista galería</strong> con el botón de toggle.</li>
</ul>

<h2>Vista galería</h2>
<p>
  Muestra los productos en una grilla de 2 columnas en móvil y 4 en escritorio. Cada card muestra
  la imagen del producto, el nombre y el precio. Si un producto no tiene stock, aparece el badge
  <strong>"Sin stock"</strong> sobre la imagen.
</p>

<h2>Vista lista</h2>
<p>
  Muestra los productos en filas con imagen, nombre, descripción, precio y botón de agregar al carrito.
</p>

<h2>Búsqueda y filtros</h2>
<ul>
  <li>El buscador filtra productos por nombre en tiempo real.</li>
  <li>Al hacer clic en una categoría, se muestran solo los productos de esa categoría.</li>
  <li>Podés combinar búsqueda por texto y filtro de categoría al mismo tiempo.</li>
</ul>

<!-- 4 -->
<h1>4. Carrito de compras y pedidos</h1>

<h2>Agregar productos al carrito</h2>
<p>
  Hacé clic en el botón <strong>"Agregar al carrito"</strong> en cualquier producto.
  El carrito aparece como un panel lateral (drawer) desde la derecha.
</p>

<div class="nota">
  <strong>Límite de stock:</strong> No podés agregar más unidades de las que hay disponibles en stock.
  El botón "+" se deshabilita cuando llegás al máximo, y aparece un indicador "máx. X".
</div>

<h2>El carrito (drawer)</h2>
<p>Dentro del carrito podés:</p>
<ul>
  <li>Ver todos los productos agregados con sus cantidades y subtotales.</li>
  <li>Aumentar o disminuir la cantidad de cada producto.</li>
  <li>Eliminar productos del carrito.</li>
  <li>Ver el total del pedido.</li>
  <li>Confirmar el pedido por <strong>WhatsApp</strong> o pagar con <strong>MercadoPago</strong>.</li>
</ul>

<h2>Confirmar pedido por WhatsApp</h2>
<p>
  Al confirmar, el sistema guarda el pedido en la base de datos y abre un chat de WhatsApp con el
  detalle completo del pedido. El cliente y el administrador reciben emails de confirmación automáticamente.
</p>

<h2>Pagar con MercadoPago</h2>
<p>
  Se genera una preferencia de pago y el cliente es redirigido al checkout de MercadoPago.
  Una vez aprobado el pago, el estado del pedido se actualiza automáticamente.
</p>

<h2>Persistencia del carrito</h2>
<p>
  El carrito se guarda en el navegador (localStorage). Si cerrás el navegador y volvés,
  los productos siguen en el carrito.
</p>

<!-- 5 -->
<h1>5. Portal del cliente — Mi cuenta</h1>

<h2>¿Qué encontrás en Mi cuenta?</h2>
<p>
  Al iniciar sesión y completar el registro, accedés a tu panel personal donde podés:
</p>
<ul>
  <li>Ver y editar tus datos personales (nombre, teléfono, dirección).</li>
  <li>Ver el historial de pedidos realizados.</li>
  <li>Consultar el estado de cada pedido.</li>
  <li>Acceder al catálogo y hacer nuevos pedidos.</li>
</ul>

<h2>Datos del perfil</h2>
<p>
  Tu nombre, teléfono, dirección y provincia se incluyen automáticamente en cada pedido que
  confirmás desde el carrito. No hace falta volver a ingresarlos cada vez.
</p>

<h2>Usuarios Vendedor</h2>
<p>
  Si tenés rol de Vendedor, ves adicionalmente un badge azul "Vendedor" y un botón
  <strong>"Punto de venta"</strong> que te lleva al panel de ventas en <strong>/vendedor</strong>.
</p>

<!-- 6 -->
<h1>6. Panel de Vendedor — Punto de venta</h1>

<h2>¿Para qué sirve?</h2>
<p>
  El panel de vendedor está pensado para realizar ventas presenciales en el local.
  Permite crear pedidos manualmente, elegir productos del catálogo y cobrar por
  MercadoPago (QR) o en efectivo.
</p>
<p>Accedé desde <strong>/vendedor</strong> o desde el botón en Mi cuenta.</p>

<h2>Cómo hacer una venta</h2>
<ol>
  <li><strong>Buscá los productos:</strong> Usá el buscador o la vista galería para encontrar lo que el cliente quiere.</li>
  <li><strong>Agregá al carrito:</strong> Hacé clic sobre el producto en la galería o usá el botón "+" en la lista.</li>
  <li><strong>Completá los datos del cliente</strong> (opcionales): nombre, teléfono, dirección y localidad.</li>
  <li><strong>Elegí el método de cobro:</strong>
    <ul>
      <li><strong>Generar QR de cobro:</strong> Crea un QR de MercadoPago. El cliente lo escanea con su teléfono
          y paga. El panel se actualiza automáticamente cuando el pago se confirma.</li>
      <li><strong>Cobrar en efectivo:</strong> Registra la venta como pagada de inmediato y descuenta el stock
          automáticamente.</li>
    </ul>
  </li>
</ol>

<h2>Filtros y ordenamiento</h2>
<ul>
  <li><strong>Buscador:</strong> filtra por nombre de producto en tiempo real.</li>
  <li><strong>Ordenar:</strong> A→Z, precio menor a mayor, precio mayor a menor, mayor stock primero.</li>
  <li><strong>Con stock:</strong> checkbox para mostrar solo los productos con stock disponible.</li>
  <li><strong>Vista:</strong> galería (por defecto) o lista.</li>
</ul>

<h2>Control de stock</h2>
<p>
  El sistema no permite agregar más unidades de las que hay en stock. Cuando se confirma una
  venta en efectivo, el stock se descuenta automáticamente de la base de datos.
</p>

<!-- 7 -->
<h1>7. Panel Admin — Productos</h1>

<h2>¿Cómo acceder?</h2>
<p>
  Iniciá sesión con el email de administrador. El sistema te redirige automáticamente al panel admin
  en <strong>/admin</strong>. Seleccioná el tab <strong>Productos</strong>.
</p>

<h2>Ver y buscar productos</h2>
<p>La tabla muestra todos los productos con nombre, categoría, precio, stock e imagen.
Podés buscar por nombre usando el buscador de la tabla.</p>

<h2>Crear un producto</h2>
<ol>
  <li>Hacé clic en <strong>"Nuevo producto"</strong>.</li>
  <li>Completá los campos: nombre, categoría, precio, stock. El resto es opcional.</li>
  <li>Subí una imagen arrastrándola o haciendo clic en la zona de imagen.</li>
  <li>Hacé clic en <strong>Guardar</strong>.</li>
</ol>

<h2>Editar un producto</h2>
<p>Hacé clic en el ícono de lápiz en la fila del producto. Se abre el mismo formulario con los datos actuales.</p>

<h2>Eliminar un producto</h2>
<p>Hacé clic en el ícono de papelera. El sistema pide confirmación antes de eliminar.</p>

<h2>Carga masiva de imágenes</h2>
<p>
  La sección <strong>Carga masiva de imágenes</strong> permite subir varias fotos a la vez.
  El sistema hace coincidir cada imagen con un producto por nombre automáticamente.
</p>
<ol>
  <li>Arrastrá o seleccioná múltiples imágenes.</li>
  <li>El sistema muestra qué productos fueron reconocidos.</li>
  <li>Hacé clic en <strong>Subir todas</strong>.</li>
</ol>

<h2>Descripciones con IA</h2>
<p>
  El botón <strong>"Descripciones IA"</strong> genera automáticamente una descripción comercial
  para todos los productos que aún no tienen una. Usa inteligencia artificial (Gemini) para
  crear textos atractivos y en tono artesanal. Solo toca los productos sin descripción.
</p>

<h2>Importar desde Google Sheets</h2>
<ul>
  <li><strong>Publicar Sheet:</strong> Lee la hoja "publico" del Google Sheet configurado y actualiza
      los productos existentes (precio, categoría, IVA, costo). No borra productos.</li>
  <li><strong>Resetear:</strong> Borra TODOS los productos y los recrea desde la hoja.
      <span style="color:#B91C1C;"><strong>Precaución: las imágenes se pierden.</strong></span></li>
</ul>

<h2>Backup a Google Sheets</h2>
<p>
  El botón <strong>"Backup Sheet"</strong> exporta todos los productos actuales de Firestore
  hacia el Google Sheet. Útil para tener un respaldo o editar precios en masa desde la planilla.
</p>

<h2>Subir precios</h2>
<p>
  El botón azul <strong>"Subir precios"</strong> abre un campo donde ingresás el porcentaje
  de aumento (ej: 15 para 15%). Al confirmar, actualiza todos los precios del catálogo en lote.
  El nuevo precio se calcula como <code>precio × (1 + porcentaje/100)</code>, redondeado al entero más cercano.
</p>

<div class="alerta">
  <strong>Atención:</strong> Esta acción no se puede deshacer. Hacé un backup a Google Sheets antes de subir precios masivamente.
</div>

<h2>Limpiar IVA</h2>
<p>
  El botón violeta <strong>"Limpiar IVA"</strong> normaliza los valores de IVA corruptos en la base de datos.
  Convierte valores como <code>105</code> → <code>10.5</code>, y elimina los que no son 10.5 o 21.
</p>

<!-- 8 -->
<h1>8. Panel Admin — Categorías</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Las categorías organizan los productos del catálogo. Cada categoría tiene un nombre,
  un emoji y un slug (identificador único en minúsculas).
</p>

<h2>Crear una categoría</h2>
<ol>
  <li>Completá el emoji, nombre y slug (se genera automáticamente desde el nombre).</li>
  <li>Hacé clic en <strong>Agregar</strong>.</li>
</ol>

<h2>Editar una categoría</h2>
<p>Hacé clic en el ícono de lápiz en la categoría que querés modificar, editá los campos y guardá.</p>

<h2>Eliminar una categoría</h2>
<p>Hacé clic en el ícono de papelera. Los productos de esa categoría no se eliminan,
solo dejan de estar asociados a ella.</p>

<div class="nota">
  <strong>Nota:</strong> El slug se genera automáticamente al escribir el nombre.
  No uses espacios ni mayúsculas en el slug — usa guiones en su lugar (ej: <code>pasteleria-deco</code>).
</div>

<!-- 9 -->
<h1>9. Panel Admin — Emails masivos</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Permite enviar emails personalizados a múltiples destinatarios a la vez,
  con asistencia de inteligencia artificial para generar el contenido.
</p>

<h2>Cómo enviar un email masivo</h2>
<ol>
  <li><strong>Destinatarios:</strong> Escribí las direcciones de email y presioná Enter o coma para agregarlas.
      Podés agregar hasta 100 destinatarios.</li>
  <li><strong>Instrucción para la IA:</strong> Describí brevemente el email que querés enviar
      (ej: "Promoción de invierno con 20% de descuento en bandejas").</li>
  <li><strong>Generar con IA:</strong> La IA redacta el asunto y el cuerpo del email con el estilo de Legado.</li>
  <li><strong>Revisar y editar:</strong> Podés modificar el texto generado antes de enviar.</li>
  <li><strong>Enviar:</strong> El sistema envía un email individual a cada destinatario con el intervalo configurado.</li>
</ol>

<h2>Intervalo de envío</h2>
<p>
  Para evitar que los emails sean marcados como spam, el sistema espera unos segundos entre cada envío.
  Podés configurar este intervalo (recomendado: 2-5 segundos).
</p>

<h2>Cancelar envío</h2>
<p>
  Durante el proceso de envío aparece un botón <strong>Cancelar</strong> que detiene el envío
  de los emails restantes. Los ya enviados no pueden cancelarse.
</p>

<!-- 10 -->
<h1>10. Panel Admin — Usuarios</h1>

<h2>¿Qué podés hacer aquí?</h2>
<p>Gestión completa de los usuarios registrados en el sistema.</p>

<h2>Buscar y filtrar usuarios</h2>
<ul>
  <li>Buscá por nombre o email en el campo de búsqueda.</li>
  <li>Filtrá por tipo de usuario: Cliente, Empresa, Vendedor.</li>
</ul>

<h2>Ver detalle de un usuario</h2>
<p>Hacé clic en un usuario para ver su perfil completo: datos personales, tipo de cuenta, fecha de registro y pedidos.</p>

<h2>Bloquear / Desbloquear un usuario</h2>
<p>
  Al bloquear un usuario, no puede iniciar sesión en el sitio. Esto es útil para casos de fraude
  o cuentas problemáticas. Podés desbloquearlo en cualquier momento.
</p>

<h2>Eliminar un usuario</h2>
<p>
  Elimina el usuario de la base de datos y de Firebase Auth. Esta acción es irreversible.
  Los pedidos del usuario no se eliminan.
</p>

<h2>Enviar email a un usuario</h2>
<p>
  Desde el panel de usuario podés enviar un email individual. Podés escribirlo manualmente
  o usar la IA para generar el contenido con una instrucción breve.
</p>

<h2>Enviar ficha de producto</h2>
<p>
  Permite enviar un email con los datos de un producto específico al usuario seleccionado.
  Útil para responder consultas sobre disponibilidad o precio.
</p>

<!-- 11 -->
<h1>11. Panel Admin — Operaciones</h1>

<h2>¿Para qué sirve?</h2>
<p>
  El panel de operaciones muestra todos los pedidos recibidos, ya sea por WhatsApp,
  MercadoPago o ventas del vendedor. Es el lugar central para gestionar el estado de cada orden.
</p>

<h2>Ver pedidos</h2>
<p>
  Los pedidos se muestran ordenados por fecha, del más reciente al más antiguo.
  Cada fila muestra: cliente, canal de venta, monto, estado y fecha.
</p>

<h2>Canales de venta</h2>
<ul>
  <li><strong>mercadopago:</strong> Pedido pagado online con MercadoPago.</li>
  <li><strong>whatsapp:</strong> Pedido confirmado por WhatsApp desde el carrito del cliente.</li>
  <li><strong>vendedor:</strong> Venta creada manualmente desde el panel de vendedor.</li>
</ul>

<h2>Estados de pedido</h2>
<table>
  <tr><th>Estado</th><th>Significado</th></tr>
  <tr><td>pendiente_pago</td><td>El pedido fue creado pero el pago no se confirmó aún</td></tr>
  <tr><td>pagado</td><td>El pago fue aprobado (MercadoPago o efectivo)</td></tr>
  <tr><td>en_preparacion</td><td>El pedido está siendo preparado</td></tr>
  <tr><td>enviado</td><td>El pedido fue despachado</td></tr>
  <tr><td>entregado</td><td>El cliente recibió el pedido</td></tr>
  <tr><td>cancelado</td><td>El pedido fue cancelado</td></tr>
</table>

<h2>Ver detalle de un pedido</h2>
<p>
  Hacé clic en un pedido para ver el modal de detalle con: datos del cliente,
  canal de venta, lista de productos con cantidades y precios, monto total,
  y datos de entrega (teléfono, dirección, localidad) cuando están disponibles.
</p>

<!-- 12 -->
<h1>12. Panel Admin — Publicación Libre</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Permite crear publicaciones para redes sociales (Instagram y WhatsApp) combinando
  imágenes de productos del catálogo o imágenes propias, con captions generados por IA.
</p>

<h2>Cómo crear una publicación</h2>
<ol>
  <li><strong>Buscar producto (opcional):</strong> Buscá un producto del catálogo.
      Al seleccionarlo, su imagen se carga automáticamente como primera imagen.</li>
  <li><strong>Agregar imágenes:</strong> Arrastrá o seleccioná hasta 4 imágenes propias.
      Se pueden combinar con la imagen del producto.</li>
  <li><strong>Tema / contexto:</strong> Escribí una pista para la IA (ej: "oferta de temporada, 20% off").</li>
  <li><strong>Generar con IA:</strong> La IA crea un caption con hashtags en español argentino.</li>
  <li><strong>Editar el caption:</strong> Podés modificar el texto generado a tu gusto.</li>
</ol>

<h2>Opciones de publicación</h2>
<ul>
  <li><strong>Copiar texto:</strong> Copia el caption al portapapeles para pegarlo donde quieras.</li>
  <li><strong>Compartir por WhatsApp:</strong> Abre WhatsApp con el caption y la primera imagen lista para enviar.</li>
  <li><strong>Publicar en Instagram:</strong> Envía el caption y la imagen al sistema de publicación
      automática vía Make.com → Instagram.</li>
</ul>

<div class="nota">
  <strong>Nota sobre Instagram:</strong> La publicación en Instagram requiere tener configurado
  el webhook de Make.com y la cuenta de Instagram Business conectada. Ver sección 17 (Integraciones).
</div>

<!-- 13 -->
<h1>13. Panel Admin — Creador de Reels</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Genera automáticamente un guión para un reel de Instagram basado en productos seleccionados
  del catálogo. El guión incluye slides con títulos y subtítulos optimizados para video corto.
</p>

<h2>Cómo crear un script de reel</h2>
<ol>
  <li>Buscá y seleccioná los productos que vas a mostrar en el reel.</li>
  <li>Agregá un tema o contexto si querés orientar el contenido.</li>
  <li>Hacé clic en <strong>"Generar script"</strong>. La IA crea un slide por producto
      más uno de intro y uno de cierre.</li>
  <li>Copiá el script y usalo como guía para grabar el reel.</li>
</ol>

<!-- 14 -->
<h1>14. Panel Admin — Nosotros</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Permite editar el contenido de la sección "Nosotros" que aparece en la página principal del sitio,
  debajo del banner principal.
</p>

<h2>Campos disponibles</h2>
<ul>
  <li><strong>Sobre nosotros:</strong> Texto principal que describe la tienda, su historia y propuesta.</li>
  <li><strong>Visión:</strong> La visión a largo plazo del negocio.</li>
  <li><strong>Misión:</strong> La misión o propósito de Legado Bazar y Deco.</li>
</ul>

<h2>Guardar cambios</h2>
<p>
  Hacé clic en <strong>Guardar</strong>. Los cambios se publican en el sitio inmediatamente.
  Si los tres campos están vacíos, la sección "Nosotros" no aparece en el sitio.
</p>

<!-- 15 -->
<h1>15. Panel Admin — Legado Social</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Es el feed social propio del sitio, visible en la sección "Legado Social" de la página principal.
  Solo el administrador puede publicar. Los clientes registrados pueden comentar.
</p>

<h2>Tipos de publicación</h2>
<ul>
  <li><strong>Post libre:</strong> Texto libre con imagen opcional. Ideal para novedades,
      eventos, recetas o tips.</li>
  <li><strong>Producto:</strong> Vincula el post a un producto del catálogo, mostrando
      su imagen y precio automáticamente.</li>
</ul>

<h2>Crear un post</h2>
<ol>
  <li>Hacé clic en <strong>"Nuevo post"</strong>.</li>
  <li>Elegí el tipo: Post libre o Producto.</li>
  <li>Escribí el contenido del post.</li>
  <li>Para tipo Producto: buscá el producto por nombre o filtrá por categoría.</li>
  <li>Para tipo Libre: subí una imagen si querés.</li>
  <li>Hacé clic en <strong>Publicar</strong>.</li>
</ol>

<h2>Publicar en Instagram desde el feed</h2>
<p>
  Cada post en el feed tiene un botón <strong>"Instagram"</strong> (rosa) que envía el contenido
  directamente a Instagram a través de Make.com. La imagen del producto o del post libre
  se usa como imagen de la publicación.
</p>

<h2>Eliminar un post</h2>
<p>Hacé clic en el ícono de papelera. El post y todos sus comentarios se eliminan permanentemente.</p>

<h2>Comentarios de clientes</h2>
<p>
  Los clientes registrados pueden expandir los comentarios de cualquier post y escribir su propio comentario.
  Los comentarios se muestran en orden cronológico y no pueden ser editados por el cliente.
</p>

<!-- 16 -->
<h1>16. Panel Admin — Panfletín con QR</h1>

<h2>¿Para qué sirve?</h2>
<p>
  Genera panfletos publicitarios en formato PDF con el diseño de Legado,
  incluyendo productos seleccionados, información de contacto y un código QR
  que dirige al catálogo online.
</p>

<h2>Configuración del panfleto</h2>

<h3>Formato</h3>
<ul>
  <li><strong>A4:</strong> Hoja estándar A4 vertical (210×297 mm). Ideal para imprimir en cualquier impresora.</li>
  <li><strong>Carta:</strong> Hoja carta vertical (215×279 mm). Estándar en Argentina y Latinoamérica.</li>
  <li><strong>2×1 Horizontal:</strong> Dos panfletos lado a lado en una hoja A4 apaisada.
      Ideal para cortar y distribuir en mostrador.</li>
</ul>

<h3>Plantilla</h3>
<ul>
  <li><strong>Clásica:</strong> Fondo pergamino, colores cálidos. Estilo tradicional de Legado.</li>
  <li><strong>Moderna:</strong> Fondo chocolate oscuro, texto claro. Impacto visual fuerte.</li>
  <li><strong>Minimalista:</strong> Fondo blanco. Ideal para imprimir sin gastar mucha tinta.</li>
</ul>

<h3>Textos</h3>
<ul>
  <li>Título, subtítulo y texto promocional son totalmente editables.</li>
</ul>

<h3>Secciones opcionales</h3>
<ul>
  <li>Podés mostrar u ocultar: Código QR, Productos, WhatsApp, Instagram y Web.</li>
</ul>

<h3>Productos</h3>
<ul>
  <li>Buscá y agregá hasta 6 productos del catálogo.</li>
  <li>Cada producto muestra su imagen, nombre y precio en el panfleto.</li>
  <li>Con 1-2 productos las imágenes son más grandes; con más productos se adaptan automáticamente.</li>
</ul>

<h2>Descargar el PDF</h2>
<p>
  Hacé clic en <strong>"Descargar PDF"</strong>. El sistema genera el archivo y lo descarga
  automáticamente. El nombre del archivo incluye el formato elegido
  (ej: <code>legado-panfleto-a4.pdf</code>).
</p>

<div class="tip">
  <strong>Consejo de impresión:</strong> Para mejor calidad, imprimí en modo "Ajustar al tamaño de la página"
  y con la opción "Gráficos de alta calidad" activada.
</div>

<!-- 17 -->
<h1>17. Integraciones externas</h1>

<h2>Instagram — Publicación automática</h2>
<p>
  El sistema puede publicar automáticamente en Instagram a través de Make.com (automatización de flujos).
  El proceso es:
</p>
<ol>
  <li>Desde el panel admin (Publicación Libre o Legado Social) hacés clic en "Publicar en Instagram".</li>
  <li>El sitio envía el caption y la imagen al webhook de Make.com.</li>
  <li>Make.com recibe los datos y los publica en la cuenta de Instagram Business de Legado.</li>
</ol>

<h3>Requisitos para que funcione</h3>
<ul>
  <li>Cuenta de Instagram en modo Empresa o Creador.</li>
  <li>Página de Facebook vinculada a la cuenta de Instagram.</li>
  <li>Escenario activo en Make.com con el webhook configurado.</li>
</ul>

<h2>Google Sheets — Sincronización de productos</h2>
<p>
  El sistema está conectado a un Google Sheet para importar y exportar el catálogo:
</p>
<ul>
  <li><strong>Importar (Publicar Sheet):</strong> Lee la hoja "publico" y actualiza los productos en el sitio.</li>
  <li><strong>Exportar (Backup Sheet):</strong> Escribe todos los productos del sitio en el Sheet.</li>
</ul>
<p>Las columnas del Sheet son: nombre, categoría, subfamilia, marca, precio, IVA, costo.</p>

<h2>MercadoPago</h2>
<p>
  El sistema usa MercadoPago para procesar pagos online. Los pagos se crean automáticamente
  al confirmar un pedido o al generar el QR de cobro desde el panel de vendedor.
  El estado del pago se actualiza en tiempo real vía webhook.
</p>

<h2>Resend — Emails transaccionales</h2>
<p>
  Todos los emails automáticos del sistema (verificación de cuenta, bienvenida, confirmación de pedidos,
  emails masivos) se envían desde <strong>noreply@legadobyd.com</strong> usando el servicio Resend.
</p>

<h2>Gemini IA — Generación de contenido</h2>
<p>
  La inteligencia artificial de Google (Gemini) se usa en:
</p>
<ul>
  <li>Generación de descripciones de productos.</li>
  <li>Redacción de captions para redes sociales.</li>
  <li>Creación de scripts para reels.</li>
  <li>Generación de emails comerciales.</li>
  <li>Chatbot de consultas en el catálogo.</li>
</ul>

<!-- 18 -->
<h1>18. Preguntas frecuentes y solución de problemas</h1>

<h2>¿Por qué no puedo agregar un producto al carrito?</h2>
<p>
  El producto puede estar sin stock. Verificá el stock en el panel admin (tab Productos)
  y actualizalo si corresponde.
</p>

<h2>¿Por qué la IA da error al generar contenido?</h2>
<p>
  La cuenta de Gemini tiene un límite de solicitudes por día en el plan gratuito.
  Si da error 429 (Too Many Requests), esperá unas horas o habilitá el billing en Google Cloud Console.
</p>

<h2>¿Por qué no se publica en Instagram?</h2>
<ul>
  <li>Verificá que el escenario de Make.com esté activo (toggle ON).</li>
  <li>Verificá que la imagen del post tenga una URL pública (imagen subida a Cloudinary).</li>
  <li>Verificá que la cuenta de Instagram esté vinculada a la Página de Facebook en Make.com.</li>
</ul>

<h2>¿Por qué no llegan los emails?</h2>
<ul>
  <li>Revisá la bandeja de spam del destinatario.</li>
  <li>Verificá que el RESEND_API_KEY esté configurado en las variables de entorno de Netlify.</li>
  <li>El dominio <strong>legadobyd.com</strong> está verificado en Resend para el envío de emails.</li>
</ul>

<h2>¿Cómo actualizo los precios masivamente desde la planilla?</h2>
<ol>
  <li>Editá los precios en el Google Sheet (hoja "publico", columna F).</li>
  <li>En el panel admin → Productos → hacé clic en <strong>"Publicar Sheet"</strong>.</li>
  <li>Los precios se actualizan automáticamente en el sitio.</li>
</ol>

<h2>¿El carrito del cliente se pierde si cierra el navegador?</h2>
<p>
  No. El carrito se guarda automáticamente en el navegador. Al volver al sitio,
  los productos siguen en el carrito. Sin embargo, si el stock de algún producto
  cambió mientras tanto, el sistema no lo descuenta automáticamente del carrito.
</p>

<h2>¿Cómo cambio el número de WhatsApp que aparece en el sitio?</h2>
<p>
  El número de WhatsApp se configura en la variable de entorno <code>NEXT_PUBLIC_WHATSAPP_NUMBER</code>
  en el panel de Netlify. El formato debe ser solo números sin espacios ni guiones
  (ej: <code>5492991234567</code>).
</p>

<h2>¿Puedo tener más de un administrador?</h2>
<p>
  Sí. Agregá los emails separados por coma en la variable de entorno
  <code>NEXT_PUBLIC_ADMIN_EMAILS</code> en Netlify.
</p>

<p style="text-align:center; margin-top:60pt; color:#A0622A; font-size:9pt; border-top:1pt solid #DDD0A8; padding-top:12pt;">
  Legado Bazar y Deco — Documentación del Sistema — legadobyd.com<br>
  Generado desde el panel de administración
</p>

</body>
</html>
`
}
