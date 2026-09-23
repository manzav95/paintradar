import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, ImageUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { formatValueRange } from '@/lib/format'
import { extractLeadDraftFromImage } from '@/services/leads/extractTextFromImage'
import { useAppState } from '@/providers/AppState'
import type { ProcessResult } from '@/types/lead'
import { PIPELINE_SOURCES } from '@/types/lead'

export function LeadTester() {
  const navigate = useNavigate()
  const { analyzePipelineLead, saveProcessedLead } = useAppState()
  const [source, setSource] = useState('manual')
  const [author, setAuthor] = useState('Sarah M.')
  const [title, setTitle] = useState('Looking for painter')
  const [content, setContent] = useState(
    'Looking for someone to repaint our kitchen cabinets in Brentwood. Want quotes this week.',
  )
  const [city, setCity] = useState('Brentwood')
  const [state, setState] = useState('CA')
  const [sourceUrl, setSourceUrl] = useState('')
  const [busy, setBusy] = useState<'analyze' | 'save' | 'ocr' | null>(null)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const raw = {
    source,
    sourceUrl: sourceUrl || undefined,
    author,
    title,
    content,
    city,
    state,
  }

  const applyScreenshot = async (file: File | Blob) => {
    setBusy('ocr')
    setError(null)
    setSavedMessage(null)
    setResult(null)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
    try {
      const draft = await extractLeadDraftFromImage(file)
      setContent(draft.content)
      setTitle(draft.title)
      setAuthor(draft.author)
      setCity(draft.city)
      setState(draft.state)
      setSource(draft.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that screenshot')
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) {
        event.preventDefault()
        void applyScreenshot(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // applyScreenshot is stable enough for paste; it only writes form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void applyScreenshot(file)
  }

  const analyze = async () => {
    setBusy('analyze')
    setError(null)
    setSavedMessage(null)
    try {
      const next = await analyzePipelineLead(raw)
      setResult(next)
      return next
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyze failed')
      return null
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    setBusy('save')
    setError(null)
    setSavedMessage(null)
    try {
      const next = await analyzePipelineLead(
        { ...raw, sourcePostId: crypto.randomUUID() },
        { allowDuplicate: true },
      )
      setResult(next)
      if (!next.accepted || !next.lead) {
        setError(next.reason ? `Cannot save: ${next.reason.replaceAll('_', ' ')}` : 'This post is not a qualified lead.')
        return
      }
      const saved = await saveProcessedLead(next)
      setSavedMessage(`Saved ${saved.customerName} in ${saved.city}. Opening dashboard…`)
      window.setTimeout(() => navigate('/'), 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(null)
    }
  }

  const classification = result?.classification

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Developer Tools</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <FlaskConical className="h-6 w-6 text-gold" />
          Lead Tester
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Paste a public post, or upload / paste a screenshot. The app reads the text and runs it through the same
          pipeline.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void applyScreenshot(file)
              event.target.value = ''
            }}
          />
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition ${
              dragging ? 'border-gold bg-gold/10' : 'border-line bg-white/3 hover:border-gold/40'
            }`}
          >
            <ImageUp className="mb-2 h-5 w-5 text-gold" />
            <p className="text-sm font-semibold text-ink">
              {busy === 'ocr' ? 'Reading screenshot…' : 'Upload or paste a screenshot'}
            </p>
            <p className="mt-1 text-xs text-muted">Drop an image, click to choose, or press ⌘V / Ctrl+V</p>
            <Button
              type="button"
              variant="gold"
              size="sm"
              className="mt-3"
              disabled={busy !== null}
              onClick={(event) => {
                event.preventDefault()
                fileInputRef.current?.click()
              }}
            >
              Choose image
            </Button>
          </label>
          {previewUrl ? (
            <img src={previewUrl} alt="Uploaded screenshot" className="max-h-40 rounded-xl border border-line object-contain" />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Source">
              <Select value={source} onChange={(event) => setSource(event.target.value)}>
                {PIPELINE_SOURCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name">
              <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
            </Field>
            <Field label="Title" className="md:col-span-2">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Post Text" className="md:col-span-2">
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-40" />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
            <Field label="State">
              <Input value={state} onChange={(event) => setState(event.target.value)} />
            </Field>
            <Field label="URL" className="md:col-span-2">
              <Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => void analyze()} disabled={busy !== null || !content.trim()}>
              {busy === 'analyze' ? 'Analyzing…' : 'Analyze Lead'}
            </Button>
            <Button variant="gold" onClick={() => void save()} disabled={busy !== null || !content.trim()}>
              {busy === 'save' ? 'Saving…' : 'Save to Dashboard'}
            </Button>
          </div>
          {error ? <p className="text-sm text-urgent">{error}</p> : null}
          {savedMessage ? <p className="text-sm text-success">{savedMessage}</p> : null}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Result</h2>
          {!result || !classification ? (
            <p className="mt-6 text-sm text-muted">Run Analyze Lead to see classification, distance, and score.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat label="Is Lead" value={classification.isLead ? 'Yes' : 'No'} hot={classification.isLead} />
              <Stat label="Confidence" value={`${Math.round(classification.confidence * 100)}%`} />
              <Stat label="Category" value={classification.category} />
              <Stat label="Urgency" value={classification.urgency} />
              <Stat label="Intent" value={classification.intent.replaceAll('_', ' ')} />
              <Stat
                label="Estimated Value"
                value={formatValueRange(classification.estimatedValueLow, classification.estimatedValueHigh)}
              />
              <Stat label="Distance" value={result.distanceMiles != null ? `${result.distanceMiles.toFixed(1)} mi` : '—'} />
              <Stat label="Score" value={result.score != null ? String(result.score) : '—'} />
              <div className="sm:col-span-2 rounded-xl bg-white/4 px-3 py-3 text-sm text-muted">
                {result.accepted ? 'Qualified — ready to save.' : `Rejected: ${result.reason ?? 'unknown'}`}
                <p className="mt-2 text-xs">{classification.reasoningSummary}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  )
}

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-xl bg-white/4 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${hot ? 'text-gold' : 'text-ink'}`}>{value}</p>
    </div>
  )
}
