import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, ScanText, Save, Table2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { ENV } from '@/core/config'
import { Alert, Button, Card, SectionHeader, Spinner } from '@/shared/ui'
import { ocrImagen, resolucionesApi } from '@/domains/resoluciones/api/resoluciones.api'
import { EstadoBadge } from '@/domains/resoluciones/components/EstadoBadge'
import { TablaSuperficies } from '@/domains/resoluciones/components/TablaSuperficies'
import { parseSuperficiesPage } from '@/domains/resoluciones/utils/superficiesOcrParser'
import { construirFilas, descargarBlob, fillHoja2 } from '@/domains/resoluciones/utils/hoja2Excel'

const PLANTILLA_URL = '/plantilla-ph.xlsm'

export default function ResolucionPage() {
  const { id } = useParams()

  const [resolucion, setResolucion] = useState(null)
  const [paginasImg, setPaginasImg] = useState([]) // [{ orden, url, blob }]
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [paginasTabla, setPaginasTabla] = useState(null)
  const [ocrEnCurso, setOcrEnCurso] = useState(false)
  const [ocrError, setOcrError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    let alive = true
    const urls = []
    ;(async () => {
      try {
        const detalle = await resolucionesApi.obtener(id)
        if (!alive) return
        setResolucion(detalle)
        if (detalle.tabla?.paginas) setPaginasTabla(detalle.tabla.paginas)

        const imgs = []
        for (const p of detalle.paginas) {
          const blob = await resolucionesApi.paginaBlob(id, p.orden)
          const url = URL.createObjectURL(blob)
          urls.push(url)
          imgs.push({ orden: p.orden, url, blob })
        }
        if (alive) setPaginasImg(imgs)
      } catch (e) {
        if (alive) setError(e.message)
      } finally {
        if (alive) setCargando(false)
      }
    })()
    return () => {
      alive = false
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [id])

  const extraerOcr = useCallback(async () => {
    setOcrEnCurso(true)
    setOcrError(null)
    try {
      const out = []
      for (const img of paginasImg) {
        const bloques = await ocrImagen(img.blob, `pagina_${img.orden}.jpg`)
        const parsed = parseSuperficiesPage(bloques)
        // Para diagnóstico: copiar de la consola del navegador y pasarlo si la
        // detección de columnas sale mal.
        // eslint-disable-next-line no-console
        console.log(`[OCR] página ${img.orden} — bloques crudos`, bloques)
        // eslint-disable-next-line no-console
        console.log(`[OCR] página ${img.orden} — parseado`, parsed)
        out.push({ pagina: img.orden, ...parsed })
      }
      setPaginasTabla(out)
      toast.success('OCR terminado. Revisá las columnas y las celdas en rojo.')
    } catch (e) {
      setOcrError(
        `${e.message}. Si es un problema de CORS del servicio OCR, hay que habilitarlo ` +
          'o pasar el OCR por el backend.',
      )
    } finally {
      setOcrEnCurso(false)
    }
  }, [paginasImg])

  const upd = (pageIdx, fn) =>
    setPaginasTabla((prev) => prev.map((p, i) => (i === pageIdx ? fn(p) : p)))

  const onRoleChange = (pageIdx, colIdx, role) =>
    upd(pageIdx, (p) => ({
      ...p,
      columnRoles: p.columnRoles.map((r, i) => (i === colIdx ? role : r)),
    }))

  const onCellChange = (pageIdx, rowId, cellIdx, text) =>
    upd(pageIdx, (p) => ({
      ...p,
      rows: p.rows.map((row) =>
        row.id !== rowId
          ? row
          : { ...row, cells: row.cells.map((c, i) => (i === cellIdx ? { text, confidence: 1 } : c)) },
      ),
    }))

  const onPlantaChange = (pageIdx, rowId, text) =>
    upd(pageIdx, (p) => ({
      ...p,
      rows: p.rows.map((row) => (row.id === rowId ? { ...row, planta: text } : row)),
    }))

  const onDeleteRow = (pageIdx, rowId) =>
    upd(pageIdx, (p) => ({ ...p, rows: p.rows.filter((row) => row.id !== rowId) }))

  const guardar = async (estado) => {
    setGuardando(true)
    try {
      const actualizada = await resolucionesApi.guardarTabla(id, { paginas: paginasTabla }, estado)
      setResolucion(actualizada)
      toast.success('Guardado.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const generarExcel = async () => {
    const filas = construirFilas(paginasTabla)
    if (filas.length === 0) {
      toast.error('Asigná la columna "Ambiente" y revisá que haya al menos una fila con datos.')
      return
    }
    setGenerando(true)
    try {
      const buf = await fetch(PLANTILLA_URL).then((r) => {
        if (!r.ok) throw new Error('No se encontró la plantilla (public/plantilla-ph.xlsm).')
        return r.arrayBuffer()
      })
      const blob = fillHoja2(buf, filas)
      descargarBlob(blob, `hoja2_${resolucion.nro_resolucion.replace(/\W+/g, '_')}.xlsm`)
      await guardar('listo')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerando(false)
    }
  }

  if (cargando) {
    return (
      <Card className="animate-card-in">
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      </Card>
    )
  }
  if (error) {
    return (
      <Card className="animate-card-in">
        <Alert>{error}</Alert>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="animate-card-in">
        <Link
          to="/resoluciones"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-500"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <SectionHeader
          icon={FileSpreadsheet}
          eyebrow={`N° ${resolucion.nro_resolucion}`}
          title={resolucion.nombre}
          subtitle={`${resolucion.total_paginas} ${
            resolucion.total_paginas === 1 ? 'página escaneada' : 'páginas escaneadas'
          }`}
          actions={<EstadoBadge estado={resolucion.estado} />}
        />

        <div className="flex flex-wrap gap-3">
          {paginasImg.map((p) => (
            <a key={p.orden} href={p.url} target="_blank" rel="noreferrer">
              <img
                src={p.url}
                alt={`Página ${p.orden}`}
                className="h-28 w-24 rounded-xl border border-white/60 object-cover shadow-xs transition hover:shadow-md"
              />
            </a>
          ))}
        </div>

        <div className="mt-5">
          <Button icon={ScanText} onClick={extraerOcr} loading={ocrEnCurso}>
            {paginasTabla ? 'Volver a extraer con OCR' : 'Extraer con OCR'}
          </Button>
        </div>
        <Alert className="mt-3">{ocrError}</Alert>
      </Card>

      {paginasTabla && (
        <Card className="animate-card-in">
          <SectionHeader
            icon={Table2}
            eyebrow="Hoja2"
            title="Tabla de superficies"
            subtitle="Asigná qué es cada columna, corregí lo que el OCR haya leído mal (rojo) y completá la Planta."
          />
          <div className="-mx-2 overflow-x-auto px-2">
            <TablaSuperficies
              paginas={paginasTabla}
              onRoleChange={onRoleChange}
              onCellChange={onCellChange}
              onPlantaChange={onPlantaChange}
              onDeleteRow={onDeleteRow}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" icon={Save} onClick={() => guardar('en_proceso')} loading={guardando}>
              Guardar borrador
            </Button>
            <Button icon={FileSpreadsheet} onClick={generarExcel} loading={generando}>
              Generar Excel
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Celdas con confianza &lt; {ENV.OCR_THRESHOLD} van en rojo para revisar.
          </p>
        </Card>
      )}
    </div>
  )
}
