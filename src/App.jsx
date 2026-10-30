import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  QrCode, Link2, Download, Copy, Trash2, History, Palette, ImagePlus,
  Check, Sparkles, ExternalLink, RefreshCw, ShieldCheck, Zap, FileImage,
} from 'lucide-react'

const DEFAULT_URL = 'https://example.com'
const STORAGE_KEY = 'qr-studio-history-v1'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export default function App() {
  const [url, setUrl] = useState(DEFAULT_URL)
  const [name, setName] = useState('')
  const [foreground, setForeground] = useState('#111827')
  const [background, setBackground] = useState('#ffffff')
  const [size, setSize] = useState(1024)
  const [margin, setMargin] = useState(3)
  const [errorLevel, setErrorLevel] = useState('H')
  const [logo, setLogo] = useState('')
  const [logoFile, setLogoFile] = useState('')
  const [format, setFormat] = useState('png')
  const [qrData, setQrData] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)
  const canvasRef = useRef(null)

  const normalizedUrl = useMemo(() => url.trim(), [url])

  useEffect(() => {
    if (!normalizedUrl) { setQrData(''); return }
    let active = true
    QRCode.toDataURL(normalizedUrl, {
      width: size, margin, errorCorrectionLevel: errorLevel,
      color: { dark: foreground, light: background },
    }).then(data => { if (active) setQrData(data) })
      .catch(() => { if (active) setQrData('') })
    return () => { active = false }
  }, [normalizedUrl, size, margin, errorLevel, foreground, background])

  useEffect(() => {
    if (!qrData || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      ctx.drawImage(image, 0, 0)
      if (logo) {
        const mark = new Image()
        mark.onload = () => {
          const box = canvas.width * 0.22
          const x = (canvas.width - box) / 2
          const y = (canvas.height - box) / 2
          const pad = box * 0.13
          ctx.fillStyle = background
          ctx.beginPath()
          ctx.roundRect(x - pad, y - pad, box + pad * 2, box + pad * 2, box * .12)
          ctx.fill()
          ctx.drawImage(mark, x, y, box, box)
        }
        mark.src = logo
      }
    }
    image.src = qrData
  }, [qrData, logo, background])

  function notify(text) {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2200)
  }

  function saveToHistory() {
    if (!normalizedUrl) return
    const entry = { id: Date.now(), url: normalizedUrl, name: name.trim() || 'Untitled QR', createdAt: new Date().toISOString() }
    const next = [entry, ...history.filter(item => item.url !== normalizedUrl)].slice(0, 20)
    setHistory(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    notify('Saved to history')
  }

  function restoreItem(item) {
    setUrl(item.url)
    setName(item.name === 'Untitled QR' ? '' : item.name)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeItem(id) {
    const next = history.filter(item => item.id !== id)
    setHistory(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function downloadQR() {
    if (!normalizedUrl || !qrData) return
    if (format === 'svg') {
      const svg = await QRCode.toString(normalizedUrl, {
        type: 'svg', width: size, margin, errorCorrectionLevel: errorLevel,
        color: { dark: foreground, light: background },
      })
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
      const a = document.createElement('a')
      a.href = svgUrl
      a.download = `${safeFilename(name)}.svg`
      a.click()
      URL.revokeObjectURL(svgUrl)
    } else {
      // PNG export uses the canvas so an optional logo is included.
      const a = document.createElement('a')
      a.href = canvasRef.current.toDataURL('image/png')
      a.download = `${safeFilename(name)}.png`
      a.click()
    }
    notify(`Downloaded ${format.toUpperCase()}`)
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(normalizedUrl)
      notify('Link copied')
    } catch {
      notify('Could not access clipboard')
    }
  }

  function handleLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      notify('Logo must be under 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogo(String(reader.result))
      setLogoFile(file.name)
    }
    reader.readAsDataURL(file)
  }

  function clearLogo() {
    setLogo('')
    setLogoFile('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const valid = normalizedUrl.length > 0 && /^(https?:\/\/|mailto:|tel:|sms:)/i.test(normalizedUrl)

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-48 left-1/3 h-[430px] w-[430px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[360px] w-[360px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <header className="border-b border-white/[.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="#" className="flex items-center gap-3 no-underline">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
              <QrCode size={23} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white">
                QR<span className="text-indigo-400"> Studio</span>
              </div>
              <div className="text-[10px] tracking-[.2em] text-slate-500">
                CREATE · CUSTOMIZE · SHARE
              </div>
            </div>
          </a>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-xs font-medium text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Free forever · No account
          </div>

          <a href="https://github.com/" target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-white">
            Built for creators <ExternalLink size={12} className="ml-1 inline" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div className="mb-9 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[.07] px-3 py-1.5 text-xs font-medium text-indigo-300">
            <Sparkles size={13} /> Simple. Powerful. Free.
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your links, <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">one scan away.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Create custom QR codes for menus, campaigns, business cards and more. Download print-ready files in seconds.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="panel rounded-2xl p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Link2 size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-white">Content & design</h2>
                <p className="text-xs text-slate-500">Set up your QR code</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">Destination URL</label>
                <div className="relative">
                  <input className="field pr-11" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourwebsite.com" />
                  <Link2 size={17} className="absolute right-4 top-3.5 text-slate-500" />
                </div>
                {!valid && normalizedUrl && (
                  <p className="mt-2 text-xs text-amber-300">
                    Use a full link starting with https://, http://, mailto:, tel: or sms:.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Project name <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. El Zahraa Digital Menu" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Palette size={14} /> QR color
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-2">
                    <input aria-label="QR color" type="color" value={foreground} onChange={e => setForeground(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent" />
                    <span className="text-xs text-slate-400">{foreground.toUpperCase()}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Background color</label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-2">
                    <input aria-label="Background color" type="color" value={background} onChange={e => setBackground(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent" />
                    <span className="text-xs text-slate-400">{background.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Output size</label>
                  <span className="text-xs tabular-nums text-indigo-300">{size} × {size} px</span>
                </div>
                <input className="range w-full" type="range" min="256" max="2048" step="256" value={size} onChange={e => setSize(Number(e.target.value))} />
                <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                  <span>256 px</span><span>2048 px</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Quiet zone / margin</label>
                  <select className="field" value={margin} onChange={e => setMargin(Number(e.target.value))}>
                    <option value="1">Small</option>
                    <option value="2">Medium</option>
                    <option value="3">Standard</option>
                    <option value="5">Large</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Error correction</label>
                  <select className="field" value={errorLevel} onChange={e => setErrorLevel(e.target.value)}>
                    <option value="L">Low · 7%</option>
                    <option value="M">Medium · 15%</option>
                    <option value="Q">Quartile · 25%</option>
                    <option value="H">High · 30%</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <ImagePlus size={14} /> Center logo
                  </label>
                  {logo && <button onClick={clearLogo} className="text-xs text-rose-300 hover:text-rose-200">Remove</button>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="secondary flex w-full items-center justify-center gap-2 border-dashed text-sm">
                  <ImagePlus size={16} />{logoFile || 'Upload logo (max 2 MB)'}
                </button>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  Tip: use a simple logo and keep error correction on High when adding one. Always test the QR code before printing.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="panel rounded-2xl p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">Live preview</h2>
                  <p className="mt-1 text-xs text-slate-500">Updates as you customize</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">LIVE</span>
              </div>

              <div className="mx-auto flex min-h-[300px] max-w-[340px] flex-col items-center justify-center rounded-2xl border border-white/[.06] bg-[#090d18] p-5">
                {valid && qrData ? (
                  <div className="rounded-xl p-3 shadow-2xl" style={{ background }}>
                    <canvas ref={canvasRef} className="block h-auto w-full max-w-[240px]" />
                  </div>
                ) : (
                  <div className="grid h-60 w-60 place-items-center rounded-xl border border-dashed border-slate-700 text-slate-600">
                    <QrCode size={64} strokeWidth={1} />
                  </div>
                )}
                <p className="mt-4 max-w-full truncate text-sm font-semibold text-slate-200">{name || 'Your QR code'}</p>
                <p className="mt-1 max-w-full truncate text-xs text-slate-500">{normalizedUrl || 'Enter a destination URL'}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold text-slate-400">FILE FORMAT</label>
                  <select className="field text-sm" value={format} onChange={e => setFormat(e.target.value)}>
                    <option value="png">PNG · Image</option>
                    <option value="svg">SVG · Vector</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <button onClick={downloadQR} disabled={!valid || !qrData} className="primary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>

              <button onClick={saveToHistory} disabled={!valid} className="secondary mt-3 flex w-full items-center justify-center gap-2 text-sm disabled:opacity-40">
                <Check size={15} /> Save to history
              </button>
              <button onClick={copyUrl} disabled={!valid} className="mt-3 flex w-full items-center justify-center gap-2 text-xs text-slate-400 hover:text-white disabled:opacity-40">
                <Copy size={13} /> Copy destination link
              </button>
            </div>

            <div className="panel rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-indigo-300" />
                  <h3 className="text-sm font-semibold text-white">Recent QR codes</h3>
                </div>
                <span className="text-xs text-slate-500">{history.length}/20</span>
              </div>

              {history.length ? (
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-slate-950/30 p-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300">
                        <QrCode size={16} />
                      </div>
                      <button onClick={() => restoreItem(item)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-xs font-medium text-slate-200">{item.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{item.url}</p>
                      </button>
                      <button onClick={() => removeItem(item.id)} aria-label="Delete history item" className="text-slate-600 hover:text-rose-300">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5 text-center">
                  <History size={24} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-xs text-slate-500">Your saved codes will appear here.</p>
                </div>
              )}

              {history.length > 0 && (
                <button onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY) }} className="mt-3 text-[11px] text-slate-500 hover:text-rose-300">
                  Clear history
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Private by design', desc: 'QR generation happens locally in your browser.' },
            { icon: Zap, title: 'No limits', desc: 'Create as many static QR codes as you need.' },
            { icon: FileImage, title: 'Ready to use', desc: 'Export PNG for sharing or SVG for crisp scaling.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-4">
              <div className="mt-0.5 text-indigo-300"><Icon size={18} /></div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200">{title}</h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Updated footer with WhatsApp contact link */}
        <footer className="mt-12 border-t border-white/[.07] pt-6 text-center text-[11px] text-slate-600">
          <div>QR Studio · Free QR code generator · Your data stays in your browser</div>
          <div className="mt-2">
            Developed by{' '}
            <a
              href="https://wa.me/201013706142"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-300 transition-colors hover:text-indigo-200 hover:underline"
            >
              Abdelkader Mohamed
            </a>
          </div>
        </footer>
      </main>

      {message && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
          {message}
        </div>
      )}
    </div>
  )
}

function safeFilename(value) {
  return (value.trim() || 'qr-code').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'qr-code'
}
