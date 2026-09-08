/**
 * Reconstruye la tabla "RELACION DE SUPERFICIE" de una pagina a partir de los
 * bloques crudos del servicio OCR, y ademas:
 *   - detecta el ROL de cada columna por el texto del encabezado (con tolerancia
 *     a la deformacion tipica del OCR en fotos reales),
 *   - detecta la PLANTA (fila-seccion "PLANTA X PISO" o columna "NIVEL"),
 *   - descarta filas de totales ("SUP. TOTAL") y el bloque "RESUMEN GENERAL".
 *
 * La parte de agrupar por posicion es el port de `server/src/tableFromOcr.js`
 * (a su vez adaptado de `processAndFilterOCRData` del dominio geoextraccion del
 * proyecto-erp). Lo nuevo es la deteccion de encabezados/plantas.
 *
 * El usuario siempre puede corregir a mano lo que salga mal (los <select> de
 * rol vienen preseleccionados, no bloqueados).
 */

// ---------- 1. agrupamiento por posicion (port de tableFromOcr.js) ----------

const yCenter = (p) => (p[0][1] + p[2][1]) / 2
const xStartOf = (p) => Math.min(p[0][0], p[3][0])
const xEndOf = (p) => Math.max(p[1][0], p[2][0])

function buildGrid(blocks, { rowGapY = 3.5, mergeGapX = 18, columnGapX = 45 } = {}) {
  const items = blocks
    .map((b) => ({
      text: (b.text || '').trim(),
      confidence: b.confidence ?? 1,
      y: yCenter(b.points),
      xStart: xStartOf(b.points),
      xEnd: xEndOf(b.points),
    }))
    .filter((b) => b.text)
    .sort((a, b) => a.y - b.y)

  const rows = []
  items.forEach((it) => {
    const last = rows[rows.length - 1]
    if (!last || it.y - last.lastY > rowGapY) {
      rows.push({ y: it.y, lastY: it.y, items: [it] })
    } else {
      last.items.push(it)
      last.lastY = it.y
      last.y = (last.y * (last.items.length - 1) + it.y) / last.items.length
    }
  })

  rows.forEach((row) => {
    row.items.sort((a, b) => a.xStart - b.xStart)
    const merged = []
    row.items.forEach((it) => {
      const prev = merged[merged.length - 1]
      if (prev && it.xStart - prev.xEnd < mergeGapX) {
        prev.text = `${prev.text} ${it.text}`.trim()
        prev.xEnd = Math.max(prev.xEnd, it.xEnd)
        prev.confidence = Math.min(prev.confidence, it.confidence)
      } else {
        merged.push({ ...it })
      }
    })
    row.items = merged
  })

  const allX = []
  rows.forEach((row) => row.items.forEach((it) => allX.push(it.xStart)))
  allX.sort((a, b) => a - b)
  const anchors = []
  allX.forEach((x) => {
    if (anchors.length === 0 || x - anchors[anchors.length - 1] > columnGapX) anchors.push(x)
  })

  rows.forEach((row) => {
    const aligned = anchors.map(() => ({ text: '', confidence: 1 }))
    row.items.forEach((it) => {
      let closest = 0
      let min = Math.abs(it.xStart - anchors[0])
      for (let i = 1; i < anchors.length; i++) {
        const d = Math.abs(it.xStart - anchors[i])
        if (d < min) {
          min = d
          closest = i
        }
      }
      if (aligned[closest].text) {
        aligned[closest].text += ` ${it.text}`
        aligned[closest].confidence = Math.min(aligned[closest].confidence, it.confidence)
      } else {
        aligned[closest] = { text: it.text, confidence: it.confidence }
      }
    })
    row.cells = aligned
  })

  rows.sort((a, b) => a.y - b.y)
  return { columnCount: anchors.length, rows: rows.map((r) => ({ cells: r.cells })) }
}

// ---------- 2. normalizacion de texto para matchear ----------

// Quita acentos, pasa a mayusculas y colapsa a letras/numeros/espacios. El OCR
// deforma bastante ("SUPEFICPANADA", "Coratruids") -> matcheamos por trozos.
function norm(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Reglas de rol. Se prueban en orden; la primera que matchea gana.
const ROLE_RULES = [
  { role: 'planta_col', test: (s) => s.includes('NIVEL') || (s.includes('PLANTA') && !s.includes('SUP')) },
  { role: 'ambiente', test: (s) => s.includes('AMBIENTE') || s.includes('DESCRIP') },
  // Los "TOTAL" son formulas en la plantilla -> se omiten a proposito.
  { role: 'omitir', test: (s) => s.includes('PRIV') && s.includes('TOTAL') },
  { role: 'omitir', test: (s) => s.includes('CONSTR') && s.includes('TOTAL') },
  { role: 'sup_privada_construida', test: (s) => s.includes('PRIV') && s.includes('CONSTR') },
  { role: 'sup_privada_libre', test: (s) => s.includes('PRIV') && s.includes('LIBRE') },
  { role: 'sup_ideal', test: (s) => s.includes('IDEAL') },
  { role: 'sup_comun_construida', test: (s) => s.includes('COMUN') && s.includes('CONSTR') },
  { role: 'sup_comun_libre', test: (s) => s.includes('COMUN') && s.includes('LIBRE') },
  // Fallback: si solo dice "CONSTRUIDA" / "LIBRE" (sub-encabezado suelto) no se
  // puede saber si es privada o comun -> queda "omitir" y lo asigna el usuario.
]

function roleForHeaderText(text) {
  const s = norm(text)
  if (!s) return 'omitir'
  for (const r of ROLE_RULES) if (r.test(s)) return r.role
  return 'omitir'
}

// ---------- 3. deteccion de filas de encabezado ----------

const hasLetters = (s) => /[A-Za-z]/.test(s || '')
const hasDigits = (s) => /\d/.test(s || '')

// Una fila es "de encabezado" si sus celdas con texto son mayormente palabras
// sin numeros (las filas de datos traen numeros de superficie).
function isHeaderRow(row) {
  const filled = row.cells.filter((c) => c.text.trim())
  if (filled.length === 0) return false
  const wordy = filled.filter((c) => hasLetters(c.text) && !hasDigits(c.text.replace(/m2|m²/gi, '')))
  return wordy.length / filled.length >= 0.6
}

// ---------- 4. deteccion de plantas / totales ----------

const PLANTA_RE =
  /^(PLANTA|PISO|NIVEL|SEMI\s?SOTANO|SEMISOTANO|SOTANO|SUBSUELO|SUB\s?SUELO|MEZZANINE|ENTREPISO|CUBIERTA|AZOTEA|TERRAZA|PLANTA BAJA|PB)\b/

const TOTAL_RE = /^(SUP\.?\s*TOTAL|SUPERFICIE\s*TOTAL|TOTAL(ES)?|SUBTOTAL)\b/

const RESUMEN_RE = /(RESUMEN\s*GENERAL|CUADRO\s*GENERAL)/

// ---------- 5. parser publico ----------

/**
 * @param {Array} blocks  bloques OCR de UNA pagina: { points, text, confidence }
 * @returns {{
 *   columnCount: number,
 *   columnRoles: string[],     // rol sugerido por columna
 *   rows: Array<{ id: string, planta: string, cells: Array<{text,confidence}> }>
 * }}
 */
export function parseSuperficiesPage(blocks) {
  const grid = buildGrid(blocks)
  if (grid.columnCount === 0) return { columnCount: 0, columnRoles: [], rows: [] }

  // Filas de encabezado = las primeras consecutivas que parecen encabezado.
  let headerEnd = 0
  while (headerEnd < grid.rows.length && headerEnd < 4 && isHeaderRow(grid.rows[headerEnd])) {
    headerEnd++
  }

  // Texto de encabezado combinado por columna (junta el titulo de grupo
  // "SUPERFICIE PRIVADA" con el sub "CONSTRUIDA/LIBRE").
  const headerText = Array.from({ length: grid.columnCount }, () => [])
  for (let r = 0; r < headerEnd; r++) {
    grid.rows[r].cells.forEach((c, i) => {
      if (c.text.trim()) headerText[i].push(c.text.trim())
    })
  }
  let columnRoles = headerText.map((parts) => roleForHeaderText(parts.join(' ')))

  // Segunda pasada: columnas que quedaron "omitir" pero cuyo encabezado dice
  // "CONSTRUIDA" o "LIBRE" a secas (el titulo de grupo "SUPERFICIE PRIVADA /
  // COMUN" cae en la columna de al lado). Se deduce el grupo del vecino de la
  // izquierda ya clasificado, o del propio texto si menciona PRIV/COMUN.
  columnRoles = columnRoles.map((role, i) => {
    if (role !== 'omitir') return role
    const h = norm(headerText[i].join(' '))
    if (!/CONSTR|LIBRE/.test(h) || /TOTAL/.test(h)) return role
    let grupo = h.includes('PRIV') ? 'privada' : h.includes('COMUN') ? 'comun' : null
    if (!grupo) {
      for (let j = i - 1; j >= 0; j--) {
        if (columnRoles[j] === 'sup_privada_construida' || columnRoles[j] === 'sup_privada_libre') {
          grupo = 'privada'
          break
        }
        if (columnRoles[j] === 'sup_comun_construida' || columnRoles[j] === 'sup_comun_libre') {
          grupo = 'comun'
          break
        }
      }
    }
    if (!grupo) return role
    const sub = h.includes('LIBRE') ? 'libre' : 'construida'
    return `sup_${grupo}_${sub}`
  })

  // Si no se detecto ninguna columna "ambiente", asumimos que es la 1a que no
  // es planta_col (siempre hay una columna de descripcion).
  if (!columnRoles.includes('ambiente')) {
    const idx = columnRoles.findIndex((r) => r !== 'planta_col')
    if (idx >= 0) columnRoles[idx] = 'ambiente'
  }

  const ambienteIdx = columnRoles.indexOf('ambiente')

  // Tercera pasada: FALLBACK POR POSICION. En fotos reales el encabezado sale
  // demasiado deformado y quedan casi todas las columnas en "omitir". Como en
  // estas tablas de GAMC el ORDEN de columnas es fijo, se asignan por posicion:
  //   [priv.construida, priv.libre, (total), ideal, comun.construida, comun.libre, (total)]
  // Solo se hace si la deteccion por texto encontro POCOS roles (<3), y siempre
  // se puede corregir a mano en la tabla.
  const SURFACE = new Set([
    'sup_privada_construida',
    'sup_privada_libre',
    'sup_ideal',
    'sup_comun_construida',
    'sup_comun_libre',
  ])
  const detectados = columnRoles.filter((r) => SURFACE.has(r)).length

  const dataRows = grid.rows.slice(headerEnd)
  const numericCols = []
  for (let i = 0; i < grid.columnCount; i++) {
    if (i === ambienteIdx || columnRoles[i] === 'planta_col') continue
    const vals = dataRows.map((r) => (r.cells[i]?.text || '').trim()).filter(Boolean)
    const nums = vals.filter((t) => /\d/.test(t)).length
    if (vals.length >= 2 && nums / vals.length >= 0.5) numericCols.push(i)
  }

  if (detectados < 3 && numericCols.length >= 3) {
    const O = 'omitir'
    const [PC, PL, ID, CC, CL] = [
      'sup_privada_construida',
      'sup_privada_libre',
      'sup_ideal',
      'sup_comun_construida',
      'sup_comun_libre',
    ]
    const TPL = {
      3: [PC, PL, ID],
      4: [PC, PL, CC, CL],
      5: [PC, PL, ID, CC, CL],
      6: [PC, PL, O, ID, CC, CL],
      7: [PC, PL, O, ID, CC, CL, O],
      8: [PC, PL, O, ID, O, CC, CL, O],
    }
    const tpl =
      TPL[numericCols.length] ||
      numericCols.map((_, k, a) =>
        k === 0 ? PC : k === 1 ? PL : k === a.length - 1 ? O : k === a.length - 2 ? CL : k === a.length - 3 ? CC : ID,
      )
    numericCols.forEach((colI, k) => {
      columnRoles[colI] = tpl[k] || O
    })
  }

  const plantaColIdx = columnRoles.indexOf('planta_col')

  const rows = []
  let plantaActual = ''
  let corte = false // al llegar al bloque "RESUMEN GENERAL" se ignora el resto

  for (let r = headerEnd; r < grid.rows.length && !corte; r++) {
    const cells = grid.rows[r].cells
    const primeraTxt = norm(cells[ambienteIdx >= 0 ? ambienteIdx : 0]?.text || '')
    const soloPrimera =
      cells.filter((c, i) => i !== ambienteIdx && c.text.trim()).length === 0

    if (RESUMEN_RE.test(primeraTxt)) {
      corte = true
      break
    }
    if (TOTAL_RE.test(primeraTxt)) continue // fila de totales -> se descarta

    // Layout B: columna "NIVEL" con el nombre de la planta (celda fusionada ->
    // viene solo en la 1a fila del bloque; se arrastra hacia abajo).
    if (plantaColIdx >= 0) {
      const v = cells[plantaColIdx]?.text?.trim()
      if (v) plantaActual = v
    }

    // Layout A: fila que SOLO trae "PLANTA X PISO" (marca de seccion) -> fija la
    // planta y no es una fila de datos.
    if (soloPrimera && PLANTA_RE.test(primeraTxt)) {
      plantaActual = cells[ambienteIdx >= 0 ? ambienteIdx : 0].text.trim()
      continue
    }

    const ambienteTxt = (cells[ambienteIdx >= 0 ? ambienteIdx : 0]?.text || '').trim()
    if (!ambienteTxt) continue // fila vacia

    rows.push({
      id: `f-${r}`,
      planta: plantaActual,
      cells,
    })
  }

  return { columnCount: grid.columnCount, columnRoles, rows }
}

export const ROLES = [
  { key: 'omitir', label: 'Omitir' },
  { key: 'ambiente', label: 'Ambiente' },
  { key: 'sup_privada_construida', label: 'Priv. Construida' },
  { key: 'sup_privada_libre', label: 'Priv. Libre' },
  { key: 'sup_ideal', label: 'Ideal' },
  { key: 'sup_comun_construida', label: 'Común Construida' },
  { key: 'sup_comun_libre', label: 'Común Libre' },
  { key: 'planta_col', label: 'Planta (columna)' },
]
