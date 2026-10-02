import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, Menu, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import './App.css'
import { JACKET_TRANSITION_SECONDS, useJacketTransition, type JacketFlight } from './useJacketTransition'

const variants = [
  { name: 'Midnight', color: '#292b2c', swatch: '#46494b', filter: 'brightness(.48) contrast(1.15)', description: 'A little understated. Entirely unforgettable.' },
  { name: 'Pearl', color: '#afb6b9', swatch: '#dddeda', filter: 'none', description: 'A lighter shade of standing out.' },
  { name: 'Cherry', color: '#702c37', swatch: '#bd3048', filter: 'sepia(1) saturate(5) hue-rotate(303deg) brightness(.65)', description: 'For days that call for a little more color.' },
]
type Item = { variant: number; size: number; quantity: number }
type Panel = 'product' | 'bag' | 'collection' | 'about' | 'contact' | null
function readBag(): Item[] {
  try { const data: unknown = JSON.parse(localStorage.getItem('jm-bag') || '[]'); return Array.isArray(data) ? data.filter((x): x is Item => x && Number.isInteger(x.variant) && x.variant >= 0 && x.variant < 3 && [36,38,40].includes(x.size) && Number.isInteger(x.quantity) && x.quantity > 0) : [] } catch { return [] }
}
function Jacket({ variant, className = '' }: { variant: number; className?: string }) {
  return <img className={`jacket ${className}`} src="/images/puffer.png" style={{ filter: variants[variant].filter }} alt={`${variants[variant].name} high-collar puffer jacket, front view`} draggable={false} />
}
export default function App() {
  const { variant, flight, isFlying, stageRef, previewRef, selectVariant, finishFlight } = useJacketTransition()
  const [size, setSize] = useState(36)
  const [saved, setSaved] = useState<number[]>([])
  const [bag, setBag] = useState<Item[]>(readBag)
  const [panel, setPanel] = useState<Panel>(null)
  const [menu, setMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const reduceMotion = useReducedMotion()
  const next = (variant + 1) % variants.length
  const count = bag.reduce((n, item) => n + item.quantity, 0)
  useEffect(() => { try { localStorage.setItem('jm-bag', JSON.stringify(bag)) } catch { /* Shopping remains available if storage is disabled. */ } }, [bag])
  useEffect(() => { if (panel) dialog.current?.showModal(); else dialog.current?.close() }, [panel])
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 3000); return () => clearTimeout(timeout) }, [notice])
  function open(value: Panel) { setMenu(false); setPanel(value) }
  function add() {
    setBag(current => { const exists = current.some(x => x.variant === variant && x.size === size); return exists ? current.map(x => x.variant === variant && x.size === size ? { ...x, quantity: x.quantity + 1 } : x) : [...current, { variant, size, quantity: 1 }] })
    setNotice(`${variants[variant].name}, size ${size} added to your bag`)
    setPanel('bag')
  }
  function quantity(index: number, delta: number) { setBag(current => current.map((x, i) => i === index ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0)) }
  const links = <><button className="nav-active" onClick={() => { open(null) }}>Puffer jacket</button><button onClick={() => open('collection')}>All products</button><button onClick={() => open('about')}>About us</button><button onClick={() => open('contact')}>Contact</button></>
  return <main className="page-shell">
    <section className={`showcase ${variant === 1 ? 'light-theme' : ''}`} style={{ backgroundColor: variants[variant].color }} aria-label="Puffer jacket collection">
      <header className="header flex items-center justify-between">
        <a className="brand" href="#" aria-label="Jacket Masters home"><span className="monogram">JM</span><span>JACKET MASTERS</span></a>
        <nav className="desktop-nav" aria-label="Main navigation">{links}</nav>
        <div className="flex items-center gap-2"><button className="icon-button bag-button" aria-label={`Open shopping bag, ${count} items`} onClick={() => open('bag')}><ShoppingBag size={19}/>{count > 0 && <span className="bag-count">{count}</span>}</button><button className="icon-button" aria-label={saved.includes(variant) ? 'Remove jacket from favorites' : 'Save jacket to favorites'} aria-pressed={saved.includes(variant)} onClick={() => { setSaved(current => current.includes(variant) ? current.filter(x => x !== variant) : [...current, variant]); setNotice(saved.includes(variant) ? 'Removed from favorites' : 'Saved to favorites') }}><Heart size={20} fill={saved.includes(variant) ? 'currentColor' : 'none'}/></button><button className="icon-button mobile-menu" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={21}/></button></div>
      </header>
      {menu && <nav className="mobile-nav" aria-label="Mobile navigation">{links}</nav>}
      <div className="hero-grid">
        <div className="editorial">
          <div className="arrows flex gap-2"><button className="icon-button" aria-label="Previous jacket color" disabled={isFlying} onClick={() => selectVariant((variant + 2) % 3, true)}><ArrowLeft size={17}/></button><button className="icon-button" aria-label="Next jacket color" disabled={isFlying} onClick={() => selectVariant(next)}><ArrowRight size={17}/></button></div>
          <h1>Stand out<br/>Without trying</h1>
          <p className="intro">It’s not just about staying warm. It’s about stepping outside and instantly feeling confident, comfortable, and completely yourself. Designed to elevate even the simplest outfit, this jacket wraps you in lightweight warmth.</p>
          <button className="pill-button hero-cta" onClick={() => open('product')}>Get the look <ArrowUpRight size={17}/></button>
        </div>
        <div className="product-stage">
          <div className="jacket-space" ref={stageRef}>
            <AnimatePresence initial={false} custom={flight}>
              <motion.div className="jacket-layer" key={variant} custom={flight}
                initial={reduceMotion ? { opacity: 0 } : flight.backwards ? { opacity: 0, x: -130, y: -60, scale: .7 } : { opacity: 1, x: flight.x, y: flight.y, scale: flight.scale }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit="depart" variants={{ depart: (outgoing: JacketFlight) => reduceMotion ? { opacity: 0, transition: { duration: .1 } } : outgoing.backwards
                  ? { x: outgoing.x, y: outgoing.y, scale: outgoing.scale, opacity: [1, 1, 0], transition: { duration: JACKET_TRANSITION_SECONDS, opacity: { times: [0, .85, 1] }, ease: [.45, 0, .2, 1] } }
                  : { x: -180, y: -70, scale: .75, opacity: 0, transition: { duration: .55, ease: 'easeIn' } } }}
                transition={{ duration: reduceMotion ? .1 : JACKET_TRANSITION_SECONDS, ease: [.45, 0, .2, 1] }}
                onAnimationComplete={definition => { if (definition !== 'depart') finishFlight() }}>
                <div className={isFlying ? 'floating-jacket in-flight' : 'floating-jacket'}><Jacket variant={variant}/></div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="ground-shadow"/><p className="caption">Confidence,<br/>wrapped in warmth</p>
        </div>
        <div className="purchase"><div className="prices"><span>$149</span><del>$199</del></div><fieldset className="sizes"><legend>Choose your size:</legend><div className="flex gap-2">{[36,38,40].map(value => <label className={`size ${size === value ? 'selected' : ''}`} key={value}><input type="radio" name="size" value={value} checked={size === value} onChange={() => setSize(value)}/>{value}</label>)}</div></fieldset><div className="color-name"><span style={{ background: variants[variant].swatch }}/>{variants[variant].name}</div></div>
      </div>
      <button className="pill-button mobile-cta" onClick={() => open('product')}>Get the look <ArrowUpRight size={17}/></button>
      <footer className="showcase-footer"><button className="collection-link" onClick={() => open('collection')}>Explore the collection <ArrowUpRight size={14}/></button><div className="color-dots" aria-label="Jacket colors">{variants.map((v, i) => <button key={v.name} aria-label={`Select ${v.name}`} aria-pressed={variant === i} disabled={isFlying} onClick={() => selectVariant(i, i === (variant + 2) % 3)}><span style={{ background: v.swatch }}/></button>)}</div><button className="next-preview" disabled={isFlying} onClick={() => selectVariant(next)}
        onContextMenu={event => { event.preventDefault(); selectVariant((variant + 2) % 3, true) }}
        onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); selectVariant((variant + 2) % 3, true) } }}
        title="Click for next color. Right-click or press Left Arrow for previous color."
        aria-label={`Try ${variants[next].name} jacket`}><span>Next up<br/><strong>{variants[next].name}</strong></span>
        <span className="preview-jacket" ref={previewRef}><motion.span className="preview-art" animate={{ opacity: isFlying ? 0 : 1 }} transition={{ duration: .18 }}><Jacket variant={next}/></motion.span></span><ArrowRight size={16}/></button></footer>
    </section><div className="outer-footer"><span>Made for the everyday. Anything but ordinary.</span><span>Jacket Masters © 2026</span></div>
    <div role="status" className={`toast ${notice ? 'visible' : ''}`}>{notice && <><Check size={16}/>{notice}</>}</div>
    <dialog ref={dialog} className="drawer" aria-label={panel === 'bag' ? 'Shopping bag' : 'Collection details'} onCancel={() => setPanel(null)} onClick={event => { if (event.target === event.currentTarget) setPanel(null) }}><div className="drawer-content"><button className="close-button icon-button" aria-label="Close panel" onClick={() => setPanel(null)}><X/></button>
      {panel === 'product' && <><p className="eyebrow">The everyday collection</p><h2>The Cloud Puffer</h2><Jacket variant={variant} className="detail-image"/><div className="flex justify-between items-start"><div><h3>{variants[variant].name}</h3><p>Size {size}</p></div><strong>$149 <del className="old-price">$199</del></strong></div><p className="description">{variants[variant].description} A sculptural, high-collar silhouette with a soft padded finish and room to move.</p><div className="detail-sizes flex gap-2">{[36,38,40].map(s => <button className={`size ${size === s ? 'selected' : ''}`} aria-pressed={size === s} key={s} onClick={() => setSize(s)}>{s}</button>)}</div><button className="dark-button" onClick={add}>Add to bag <ShoppingBag size={18}/></button><p className="prototype-note">Concept storefront. Product details and pricing are illustrative.</p></>}
      {panel === 'bag' && <><p className="eyebrow">A good choice</p><h2>Your bag <span>({count})</span></h2>{!count ? <div className="empty-bag"><ShoppingBag size={42} strokeWidth={1}/><h3>A little room for something good.</h3><button className="dark-button" onClick={() => setPanel('product')}>Discover the puffer <ArrowRight size={18}/></button></div> : <><div className="bag-items">{bag.map((item, i) => <div className="bag-item" key={`${item.variant}-${item.size}`}><Jacket variant={item.variant}/><div><h3>Cloud Puffer</h3><p>{variants[item.variant].name} / Size {item.size}</p><div className="quantity"><button aria-label={`Remove one ${variants[item.variant].name}, size ${item.size}`} onClick={() => quantity(i,-1)}><Minus size={14}/></button><span>{item.quantity}</span><button aria-label={`Add one ${variants[item.variant].name}, size ${item.size}`} onClick={() => quantity(i,1)}><Plus size={14}/></button></div></div><strong>${149 * item.quantity}</strong></div>)}</div><div className="total"><span>Subtotal</span><strong>${149 * count}</strong></div><p className="prototype-note">Your bag is saved on this device. Checkout will be available when the store launches.</p><button className="dark-button" onClick={() => setPanel(null)}>Continue exploring <ArrowRight size={18}/></button></>}</>}
      {panel === 'collection' && <><p className="eyebrow">One silhouette. Three moods.</p><h2>The collection</h2><div className="collection-grid">{variants.map((v,i) => <button key={v.name} onClick={() => { selectVariant(i, i === (variant + 2) % 3); setPanel(null) }}><div style={{ background: v.color }}><Jacket variant={i}/></div><span>{v.name}<ArrowUpRight size={17}/></span><small>Cloud Puffer · $149</small></button>)}</div></>}
      {panel === 'about' && <><p className="eyebrow">Jacket Masters</p><h2>Warmth with<br/>a point of view.</h2><p className="large-copy">We believe the pieces you reach for every day should feel anything but ordinary.</p><p className="description">The Cloud Puffer explores a simple idea: a confident silhouette, considered color, and comfort that goes wherever the day takes you.</p><p className="prototype-note">This is an independent fashion storefront concept, built around an imagined collection.</p><button className="dark-button" onClick={() => setPanel('collection')}>Meet the collection <ArrowRight size={18}/></button></>}
      {panel === 'contact' && <><p className="eyebrow">Keep in touch</p><h2>Good things<br/>are on the way.</h2><p className="large-copy">Our storefront is taking shape.</p><p className="description">Customer support and social channels will be shared here when the collection launches.</p><button className="dark-button" onClick={() => setPanel(null)}>Back to the collection <ArrowRight size={18}/></button></>}
    </div></dialog>
  </main>
}
