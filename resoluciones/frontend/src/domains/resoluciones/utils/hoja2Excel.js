/**
 * Llena la Hoja2 de `plantilla-ph.xlsm` con las filas revisadas por el usuario y
 * dispara la descarga del .xlsm. Todo en el navegador con SheetJS.
 *
 * Mapeo de columnas: deducido leyendo las FORMULAS reales de la plantilla
 * (ver server/README.md del repo). Se ESCRIBEN A (Planta), C (Ambiente),
 * D/E (Priv. Construida/Libre), G (Ideal), H/I (Común Construida/Libre).
 * NO se tocan F (=D+E) ni J (=D+H): son fórmulas que se calculan solas.
 * Primera fila de datos = 10.
 */
import * as XLSX from 'xlsx'

const HOJA2 = 'Hoja2'
const FIRST_ROW = 10

// "1.234,56" (boliviano) o "1234.56" o con letras pegadas por el OCR -> número.
export function parseNumero(texto) {
  if (texto == null || texto === '') return null
  const limpio = String(texto).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const n = parseFloat(limpio)
  return Number.isNaN(n) ? null : n
}

function setCell(ws, addr, value) {
  if (value == null || value === '') return
  ws[addr] = typeof value === 'number' ? { t: 'n', v: value } : { t: 's', v: String(value) }
}

/**
 * @param {ArrayBuffer} templateBuf  bytes de plantilla-ph.xlsm
 * @param {Array<{planta,ambiente,sup_privada_construida,sup_privada_libre,sup_ideal,sup_comun_construida,sup_comun_libre}>} filas
 * @returns {Blob}  el .xlsm llenado
 */
export function fillHoja2(templateBuf, filas) {
  const wb = XLSX.read(templateBuf, { type: 'array', bookVBA: true, cellStyles: true })
  const ws = wb.Sheets[HOJA2]
  if (!ws) throw new Error('La plantilla no tiene una hoja "Hoja2".')

  filas.forEach((f, i) => {
    const r = FIRST_ROW + i
    setCell(ws, `A${r}`, f.planta)
    setCell(ws, `C${r}`, f.ambiente)
    setCell(ws, `D${r}`, f.sup_privada_construida)
    setCell(ws, `E${r}`, f.sup_privada_libre)
    setCell(ws, `G${r}`, f.sup_ideal)
    setCell(ws, `H${r}`, f.sup_comun_construida)
    setCell(ws, `I${r}`, f.sup_comun_libre)
  })

  const lastRow = FIRST_ROW + filas.length - 1
  const range = XLSX.utils.decode_range(ws['!ref'])
  if (range.e.r < lastRow - 1) {
    range.e.r = lastRow - 1
    ws['!ref'] = XLSX.utils.encode_range(range)
  }

  const out = XLSX.write(wb, { bookType: 'xlsm', bookVBA: true, type: 'array' })
  return new Blob([out], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' })
}

/** Construye las filas para fillHoja2() a partir de la tabla editada por el usuario. */
export function construirFilas(paginas, threshold) {
  const filas = []
  paginas.forEach((pagina) => {
    const roles = pagina.columnRoles
    const idx = (rol) => roles.indexOf(rol)
    const iAmb = idx('ambiente')
    const iPC = idx('sup_privada_construida')
    const iPL = idx('sup_privada_libre')
    const iId = idx('sup_ideal')
    const iCC = idx('sup_comun_construida')
    const iCL = idx('sup_comun_libre')

    pagina.rows.forEach((row) => {
      const cellTxt = (i) => (i < 0 ? '' : row.cells[i]?.text?.trim() || '')
      const ambiente = cellTxt(iAmb)
      if (!ambiente) return
      filas.push({
        planta: (row.planta || '').trim(),
        ambiente,
        sup_privada_construida: parseNumero(cellTxt(iPC)),
        sup_privada_libre: parseNumero(cellTxt(iPL)),
        sup_ideal: parseNumero(cellTxt(iId)),
        sup_comun_construida: parseNumero(cellTxt(iCC)),
        sup_comun_libre: parseNumero(cellTxt(iCL)),
      })
    })
  })
  return filas
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
