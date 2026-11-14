// Effects engine: every effect is a component drawn on a transparent layer.
// layer "behind" goes under the person (needs the matte), "front" goes on top.
// Some effects draw on both (orbit-text: far side behind the head, near side in front).
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, FPS, ramp, sp} from './brand';

export type Face = [number, number, number] | null; // cx, cy, size (px) per frame
export type Cue = {fx: string; t: number; dur: number; props?: Record<string, any>};
export type FxLayerProps = {layer: 'behind' | 'front'; cues: Cue[]; faces: Face[]; duration: number; width: number; height: number; src?: string};

type FxArgs = {p: Record<string, any>; f: number; d: number; layer: 'behind' | 'front'; face: Face; abs: number; src?: string; t0: number};
// backdrop blur has nothing to blur on a transparent layer, so use tinted glass that reads on any footage
const glass: React.CSSProperties = {background: 'rgba(6,17,13,0.66)', border: '2px solid rgba(255,255,255,0.24)', boxShadow: '0 18px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)'};
const inOut = (f: number, d: number, inF = 10, outF = 10) => Math.min(ramp(f, 0, inF), 1 - ramp(f, d - outF, d));

// ---------------------------------------------------------------- title-behind (text behind head)
const TitleBehind: React.FC<FxArgs> = ({p, f, d, face}) => {
	const {width, height} = useVideoConfig();
	const words: string[] = String(p.text ?? 'TEXT').split('|');
	const longest = Math.max(...words.map((w) => w.length));
	// the text block ends a little below the top of the face, so the hair/head covers its lower part
	const faceTop = face ? face[1] - face[2] * 0.5 : height * 0.3;
	const bottom = faceTop + (face ? face[2] * 0.08 : 0);
	const room = bottom - height * 0.035;
	const size = p.size ?? Math.round(Math.min(width * 0.28, (width * 1.22) / Math.max(4, longest), room / (0.92 * words.length)));
	const blockH = size * 0.92 * words.length;
	const top = p.y != null ? height * p.y - blockH / 2 : bottom - blockH;
	const o = inOut(f, d, 6, 10);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: Math.max(height * 0.04, top), opacity: o}}>
			{words.map((w, i) => {
				const s = sp(f, i * 5, 12, 0.8);
				return (
					<div key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 0.92, letterSpacing: -size * 0.03, color: i === words.length - 1 ? (p.color ?? C.green) : C.white, transform: `translateY(${(1 - s) * size * 0.8}px) scale(${0.9 + s * 0.1 + f * 0.0006})`, textShadow: `0 ${size * 0.04}px ${size * 0.12}px rgba(0,0,0,0.35)`, whiteSpace: 'nowrap'}}>
						{w}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- glass-widgets
const GlassWidgets: React.FC<FxArgs> = ({p, f, d, face}) => {
	const {width, height} = useVideoConfig();
	const items: {icon?: string; title: string; value?: string}[] = p.items ?? [{icon: '🔥', title: 'Views', value: '4.2L'}];
	const unit = width / 1080;
	const cx = face ? face[0] : width / 2;
	const slots = [
		{x: cx - 470 * unit, y: height * 0.36},
		{x: cx + 120 * unit, y: height * 0.31},
		{x: cx - 430 * unit, y: height * 0.55},
		{x: cx + 140 * unit, y: height * 0.52},
	];
	return (
		<AbsoluteFill>
			{items.slice(0, 4).map((it, i) => {
				const delay = i * 8;
				const s = sp(f, delay, 11, 0.6);
				const out = ramp(f, d - 10, d);
				const bob = Math.sin((f + i * 20) / 18) * 8 * unit;
				const sl = slots[i];
				const x = Math.max(24 * unit, Math.min(width - 380 * unit, sl.x));
				return (
					<div key={i} style={{position: 'absolute', left: x, top: sl.y + bob, width: 350 * unit, padding: `${22 * unit}px ${26 * unit}px`, borderRadius: 34 * unit, ...glass, transform: `scale(${s * (1 - out)}) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg)`, transformOrigin: 'center', display: 'flex', alignItems: 'center', gap: 18 * unit}}>
						<div style={{width: 76 * unit, height: 76 * unit, borderRadius: 22 * unit, background: C.green + '33', border: `2px solid ${C.green}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 * unit, flexShrink: 0}}>{it.icon ?? '✨'}</div>
						<div style={{minWidth: 0}}>
							<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 26 * unit, color: 'rgba(255,255,255,0.85)'}}>{it.title}</div>
							{it.value ? <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 46 * unit, color: C.white, lineHeight: 1.05}}>{it.value}</div> : null}
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- spotlight (+ glitter)
const Spotlight: React.FC<FxArgs> = ({p, f, d, face}) => {
	const {width, height} = useVideoConfig();
	const o = inOut(f, d, 8, 10);
	const cx = p.x != null ? p.x * width : face ? face[0] : width / 2;
	const cy = p.y != null ? p.y * height : face ? face[1] + face[2] * 0.25 : height * 0.4;
	const r = (p.r ?? (face ? face[2] * 1.15 : width * 0.25)) * (0.85 + 0.15 * sp(f, 0, 12));
	const sparkles = p.glitter
		? Array.from({length: 40}, (_, i) => {
				const a = random(`g${i}`) * Math.PI * 2 + f * 0.02;
				const rr = r * (0.9 + random(`r${i}`) * 0.6);
				const tw = 0.5 + 0.5 * Math.sin(f / 4 + i);
				return <div key={i} style={{position: 'absolute', left: cx + Math.cos(a) * rr, top: cy + Math.sin(a) * rr, width: 10, height: 10, borderRadius: '50%', background: i % 3 ? C.yellow : C.white, boxShadow: `0 0 14px ${C.yellow}`, opacity: tw * o}} />;
			})
		: null;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 0%, transparent 70%, rgba(0,0,0,${0.78 * o}) 100%)`}} />
			<div style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', boxShadow: `0 0 0 4px ${C.yellow}${Math.round(o * 200).toString(16).padStart(2, '0')}, 0 0 60px ${C.yellow}66`, opacity: o}} />
			{sparkles}
			{p.label ? (
				<div style={{position: 'absolute', left: 0, right: 0, top: Math.min(height * 0.85, cy + r + 30), textAlign: 'center', opacity: o, transform: `translateY(${(1 - sp(f, 6)) * 40}px)`}}>
					<span style={{fontFamily: FONT, fontWeight: 900, fontSize: width * 0.06, color: C.ink, background: C.yellow, padding: '8px 28px', borderRadius: 999}}>{p.label}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- checklist
const Checklist: React.FC<FxArgs> = ({p, f, d}) => {
	const {width, height} = useVideoConfig();
	const unit = width / 1080;
	const items: string[] = p.items ?? ['Hook', 'Value', 'CTA'];
	const gap = p.every != null ? p.every * FPS : Math.max(10, (d - 30) / items.length);
	const o = inOut(f, d, 8, 10);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: height * (p.y ?? 0.12), opacity: o}}>
			<div style={{width: 820 * unit, padding: 36 * unit, borderRadius: 40 * unit, ...glass, background: `rgba(6,17,13,${p.opacity ?? 0.97})`, transform: `scale(${0.9 + 0.1 * sp(f, 0)})`}}>
				{p.title ? <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 54 * unit, color: C.white, marginBottom: 18 * unit}}>{p.title}</div> : null}
				{items.map((it, i) => {
					const tickF = 12 + i * gap;
					const on = sp(f, tickF, 9, 0.5);
					const show = sp(f, i * 4, 14);
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22 * unit, padding: `${12 * unit}px 0`, opacity: show}}>
							<div style={{width: 60 * unit, height: 60 * unit, borderRadius: 16 * unit, border: `4px solid ${on > 0.5 ? C.green : 'rgba(255,255,255,0.5)'}`, background: on > 0.5 ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 * unit, color: C.ink, fontWeight: 900, transform: `scale(${1 + 0.25 * Math.sin(Math.min(1, on) * Math.PI)})`}}>
								{on > 0.5 ? '✓' : ''}
							</div>
							<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46 * unit, color: on > 0.5 ? C.white : 'rgba(255,255,255,0.7)', textDecoration: p.strike && on > 0.5 ? 'line-through' : 'none'}}>{it}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- orbit-text / orbit photos (both layers)
const Orbit: React.FC<FxArgs> = ({p, f, d, face, layer}) => {
	const {width, height} = useVideoConfig();
	const images: string[] = p.images ?? [];
	const words: string[] = images.length ? images : String(p.text ?? 'AI · REELS · GROWTH').split(/\s*·\s*|\s*\|\s*/);
	const cx = face ? face[0] : width / 2;
	const cy = face ? face[1] : height * 0.35;
	const R = (face ? face[2] : width * 0.2) * (p.radius ?? (images.length ? 1.45 : 1.25));
	const o = inOut(f, d, 10, 10);
	const speed = p.speed ?? (images.length ? 0.028 : 0.035);
	const n = Math.max(3, words.length);
	const card = (p.size ?? 0.2) * width;
	const items = words.map((w, i) => {
		const a = f * speed + (i / n) * Math.PI * 2;
		const z = Math.sin(a); // >0 = near side (in front of the head)
		return {w, i, a, z};
	}).sort((x, y) => x.z - y.z);
	return (
		<AbsoluteFill style={{opacity: o}}>
			{items.map(({w, i, a, z}) => {
				if ((layer === 'front') !== z > 0) return null;
				const Rx = Math.min(R * 1.6, Math.min(cx, width - cx) + (images.length ? card * 0.35 : width * 0.08));
				const x = cx + Math.cos(a) * Rx;
				const y = cy + z * R * 0.35 - R * 0.1;
				const s = 0.62 + 0.38 * (z + 1) / 2;
				const pop = sp(f, i * 3, 12);
				if (images.length) {
					return (
						<div key={i} style={{position: 'absolute', left: x, top: y, width: card, height: card * 1.18, transform: `translate(-50%,-50%) scale(${s * pop}) rotate(${Math.cos(a) * -8}deg)`, borderRadius: card * 0.12, overflow: 'hidden', border: `${Math.max(4, card * 0.03)}px solid ${C.white}`, boxShadow: `0 ${card * 0.08}px ${card * 0.2}px rgba(0,0,0,0.45)`, filter: `brightness(${0.7 + 0.3 * (z + 1) / 2})`}}>
							<Img src={staticFile(w)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
						</div>
					);
				}
				return (
					<div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, fontFamily: FONT, fontWeight: 900, fontSize: width * 0.055, color: i % 2 ? C.yellow : C.green, whiteSpace: 'nowrap', textShadow: '0 4px 14px rgba(0,0,0,0.5)', opacity: 0.55 + 0.45 * (z + 1) / 2}}>
						{w}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- money-counter
const fmtIN = (n: number) => Math.round(n).toLocaleString('en-IN');
const MoneyCounter: React.FC<FxArgs> = ({p, f, d}) => {
	const {width, height} = useVideoConfig();
	const unit = width / 1080;
	const from = p.from ?? 0, to = p.to ?? 100000;
	const v = interpolate(f, [6, Math.min(d - 15, 6 + (p.count ?? 1.6) * FPS)], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const done = f > 6 + (p.count ?? 1.6) * FPS;
	const o = inOut(f, d, 6, 10);
	const pop = done ? 1 + 0.08 * Math.max(0, 1 - (f - 6 - (p.count ?? 1.6) * FPS) / 8) : 1;
	const col = p.color ?? (to < from ? C.red : C.green);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: height * (p.y ?? 0.14), opacity: o}}>
			<div style={{textAlign: 'center', transform: `scale(${(0.8 + 0.2 * sp(f, 0)) * pop})`}}>
				{p.label ? <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44 * unit, color: C.white, marginBottom: 6, textShadow: '0 3px 10px rgba(0,0,0,0.6)'}}>{p.label}</div> : null}
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: (p.size ?? 150) * unit, color: col, lineHeight: 1, WebkitTextStroke: `${6 * unit}px ${C.ink}`, paintOrder: 'stroke', filter: `drop-shadow(0 0 ${30 * unit}px ${col}88)`}}>
					{p.prefix ?? '₹'}{fmtIN(v)}{p.suffix ?? ''}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- iphone-ui (notification / toggle)
const IPhoneUI: React.FC<FxArgs> = ({p, f, d}) => {
	const {width} = useVideoConfig();
	const unit = width / 1080;
	const s = sp(f, 0, 13, 0.7);
	const out = ramp(f, d - 10, d);
	if ((p.kind ?? 'notification') === 'toggle') {
		const on = ramp(f, 14, 22);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 260 * unit, opacity: 1 - out}}>
				<div style={{width: 900 * unit, padding: `${30 * unit}px ${40 * unit}px`, borderRadius: 40 * unit, background: 'rgba(28,28,30,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: `scale(${s})`}}>
					<div style={{fontFamily: '-apple-system, ' + FONT, fontWeight: 600, fontSize: 46 * unit, color: C.white}}>{p.title ?? 'Viral mode'}</div>
					<div style={{width: 150 * unit, height: 90 * unit, borderRadius: 999, background: on > 0.5 ? '#34C759' : '#3A3A3C', position: 'relative'}}>
						<div style={{position: 'absolute', top: 6 * unit, left: (6 + on * 60) * unit, width: 78 * unit, height: 78 * unit, borderRadius: '50%', background: C.white, boxShadow: '0 3px 8px rgba(0,0,0,0.3)'}} />
					</div>
				</div>
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 70 * unit}}>
			<div style={{width: 960 * unit, padding: 26 * unit, borderRadius: 44 * unit, background: 'rgba(245,245,245,0.86)', backdropFilter: 'blur(20px)', display: 'flex', gap: 22 * unit, alignItems: 'center', transform: `translateY(${(1 - s) * -300 * unit - out * 300 * unit}px)`, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'}}>
				<div style={{width: 96 * unit, height: 96 * unit, borderRadius: 24 * unit, background: p.color ?? C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 * unit}}>{p.icon ?? '💬'}</div>
				<div style={{flex: 1, minWidth: 0, fontFamily: '-apple-system, ' + FONT}}>
					<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30 * unit, color: '#555', fontWeight: 600}}>
						<span>{p.app ?? 'Instagram'}</span><span>{p.when ?? 'now'}</span>
					</div>
					<div style={{fontSize: 38 * unit, fontWeight: 700, color: '#111'}}>{p.title ?? 'New follower'}</div>
					<div style={{fontSize: 34 * unit, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{p.body ?? ''}</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- news-cut
const NewsCut: React.FC<FxArgs> = ({p, f, d, src, t0}) => {
	const {width, height} = useVideoConfig();
	const unit = width / 1080;
	const flash = Math.max(0, 1 - f / 6);
	const bar = sp(f, 3, 14);
	const o = 1 - ramp(f, d - 8, d);
	const tick = (f * 6) % (width * 2);
	return (
		<AbsoluteFill style={{opacity: o}}>
			{src ? (
				<AbsoluteFill style={{filter: 'contrast(1.15) saturate(1.2)'}}>
					<OffthreadVideo src={staticFile(src)} startFrom={Math.round(t0 * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.12 - 0.04 * ramp(f, 0, d)})`}} />
				</AbsoluteFill>
			) : null}
			<AbsoluteFill style={{background: `linear-gradient(transparent 60%, rgba(120,0,0,0.35))`}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: height * 0.2, transform: `translateX(${(1 - bar) * -width}px)`}}>
				<div style={{display: 'inline-block', background: '#E10600', color: C.white, fontFamily: FONT, fontWeight: 900, fontSize: 44 * unit, padding: `${8 * unit}px ${26 * unit}px`, letterSpacing: 3}}>{p.tag ?? 'BREAKING'}</div>
				<div style={{background: C.white, color: '#111', fontFamily: FONT, fontWeight: 900, fontSize: 62 * unit, padding: `${14 * unit}px ${26 * unit}px`, lineHeight: 1.1}}>{p.headline ?? 'Headline here'}</div>
				<div style={{background: '#111', color: C.yellow, fontFamily: FONT, fontWeight: 700, fontSize: 32 * unit, padding: `${8 * unit}px 0`, whiteSpace: 'nowrap', overflow: 'hidden'}}>
					<span style={{display: 'inline-block', transform: `translateX(${width - tick}px)`}}>{p.ticker ?? '● LIVE ● AI WALA KAPIL ● LIVE ●'}</span>
				</div>
			</div>
			<AbsoluteFill style={{background: C.white, opacity: flash}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- freeze-callout
const FreezeCallout: React.FC<FxArgs> = ({p, f, d, face}) => {
	const {width, height} = useVideoConfig();
	const unit = width / 1080;
	const s = sp(f, 2, 10, 0.6);
	const o = 1 - ramp(f, d - 6, d);
	return (
		<AbsoluteFill style={{opacity: o}}>
			{p.still ? <Img src={staticFile(p.still)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: `saturate(${1 - 0.7 * s}) contrast(1.1)`, transform: `scale(${1 + 0.05 * s})`}} /> : null}
			<AbsoluteFill style={{border: `${14 * unit}px solid ${C.yellow}`, opacity: s}} />
			<div style={{position: 'absolute', left: 60 * unit, top: face ? Math.min(height * 0.7, face[1] + face[2]) : height * 0.55, transform: `rotate(-4deg) scale(${s})`, transformOrigin: 'left center'}}>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 96 * unit, color: C.ink, background: C.yellow, padding: `${6 * unit}px ${30 * unit}px`, display: 'inline-block'}}>{p.name ?? 'NAME'}</div>
				{p.sub ? <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44 * unit, color: C.white, background: C.ink, padding: `${6 * unit}px ${24 * unit}px`, display: 'inline-block', marginTop: 8 * unit}}>{p.sub}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- chart (bars that grow)
const Chart: React.FC<FxArgs> = ({p, f, d}) => {
	const {width, height} = useVideoConfig();
	const unit = width / 1080;
	const bars: {label: string; value: number}[] = p.bars ?? [{label: 'Day 1', value: 2}, {label: 'Day 7', value: 9}];
	const max = Math.max(...bars.map((b) => b.value));
	const o = inOut(f, d, 8, 10);
	const H = 520 * unit;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: height * (p.y ?? 0.1), opacity: o}}>
			<div style={{width: 900 * unit, padding: 36 * unit, borderRadius: 40 * unit, ...glass}}>
				{p.title ? <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 50 * unit, color: C.white, marginBottom: 20 * unit}}>{p.title}</div> : null}
				<div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 60 * unit, height: H}}>
					{bars.map((b, i) => {
						const g = sp(f, 8 + i * 6, 16);
						const h = (b.value / max) * (H - 90 * unit) * g;
						return (
							<div key={i} style={{flex: 1, maxWidth: 200 * unit, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%'}}>
								<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 38 * unit, color: C.white, opacity: g}}>{p.prefix ?? ''}{Math.round(b.value * g * 10) / 10}{p.suffix ?? ''}</div>
								<div style={{width: '100%', maxWidth: 170 * unit, height: h, borderRadius: `${16 * unit}px ${16 * unit}px 0 0`, background: i === bars.length - 1 ? C.green : 'rgba(255,255,255,0.35)', boxShadow: i === bars.length - 1 ? `0 0 30px ${C.green}88` : 'none'}} />
								<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30 * unit, color: C.mute, marginTop: 10 * unit}}>{b.label}</div>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- transitions on the base video
// zoom-punch, whip, glitch, flash, shake: re-draw the source frame transformed for a few frames.
const Transition: React.FC<FxArgs> = ({p, f, d, src, t0, face}) => {
	const {width} = useVideoConfig();
	const kind = p.kind ?? 'zoom-punch';
	const k = f / Math.max(1, d - 1); // 0..1
	const bell = Math.sin(Math.min(1, k) * Math.PI);
	let transform = '', filter = '', origin = '50% 50%', extra: React.ReactNode = null;
	if (kind === 'zoom-punch') transform = `scale(${1 + (p.amount ?? 0.18) * (k < 0.25 ? ramp(f, 0, d * 0.25) : 1)})`;
	if (kind === 'zoom-hold') {
		// steady punch-in centred on the face (hides jump cuts); eases in over 3 frames
		const ox = face ? (face[0] / width) * 100 : 50, oy = face ? (face[1] / useVideoConfig().height) * 100 : 40;
		transform = `scale(${1 + (p.amount ?? 0.12) * ramp(f, 0, 3)})`;
		origin = `${ox}% ${oy}%`;
	}
	if (kind === 'zoom-through') { transform = `scale(${1 + 1.6 * bell})`; filter = `blur(${bell * 10}px)`; }
	if (kind === 'whip') { transform = `translateX(${(k < 0.5 ? -1 : 1) * bell * width * 0.35}px)`; filter = `blur(${bell * 28}px)`; }
	if (kind === 'shake') transform = `translate(${(random(`x${f}`) - 0.5) * 40 * bell}px, ${(random(`y${f}`) - 0.5) * 40 * bell}px) rotate(${(random(`r${f}`) - 0.5) * 3 * bell}deg)`;
	if (kind === 'flash') extra = <AbsoluteFill style={{background: C.white, opacity: bell}} />;
	if (kind === 'glitch') {
		const on = random(`gl${Math.floor(f / 2)}`) > 0.35;
		transform = on ? `translateX(${(random(`gx${f}`) - 0.5) * 60}px)` : '';
		filter = on ? 'hue-rotate(90deg) saturate(2)' : '';
		extra = on ? <AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(0,229,143,0.18) 0 6px, transparent 6px 22px)`, mixBlendMode: 'screen'}} /> : null;
	}
	if (kind === 'light-leak') extra = <AbsoluteFill style={{background: `radial-gradient(circle at ${20 + 60 * k}% 30%, rgba(255,170,60,${0.75 * bell}), rgba(255,60,120,${0.35 * bell}) 40%, transparent 70%)`, mixBlendMode: 'screen'}} />;
	const needsVideo = kind !== 'flash' && kind !== 'light-leak';
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{needsVideo && src ? <OffthreadVideo src={staticFile(src)} startFrom={Math.round(t0 * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform, filter, transformOrigin: origin}} /> : null}
			{extra}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- edit-timeline (fake NLE timeline with moving playhead)
const EditTimeline: React.FC<FxArgs> = ({p, f, d}) => {
	const {width, height} = useVideoConfig();
	const unit = width / 1080;
	const o = inOut(f, d, 8, 10);
	const rise = sp(f, 0, 14);
	const tracks: {name: string; clips: [number, number, string][]}[] = p.tracks ?? [
		{name: 'V2', clips: [[0.05, 0.3, 'Title'], [0.55, 0.85, 'Glass']]},
		{name: 'V1', clips: [[0, 0.33, 'Hook'], [0.34, 0.66, 'Demo'], [0.67, 1, 'CTA']]},
		{name: 'A1', clips: [[0, 1, 'Voice']]},
		{name: 'A2', clips: [[0, 1, 'Music']]},
	];
	const W = 960 * unit, rowH = 64 * unit;
	const head = interpolate(f, [6, d - 6], [0.02, 0.98], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cols = [C.green, '#7C9CFF', '#FFB547', '#FF6B9A'];
	return (
		<AbsoluteFill style={{opacity: o}}>
			<div style={{position: 'absolute', left: (width - W) / 2, top: height * (p.y ?? 0.6) + (1 - rise) * 200 * unit, width: W, padding: 18 * unit, borderRadius: 26 * unit, background: 'rgba(16,18,22,0.92)', border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 800, fontSize: 24 * unit, color: C.mute, marginBottom: 10 * unit}}>
					<span>{p.title ?? '🎬 Claude Code · timeline'}</span><span style={{color: C.green}}>{`00:${String(Math.floor(head * (p.seconds ?? 30))).padStart(2, '0')}`}</span>
				</div>
				<div style={{position: 'relative'}}>
					{tracks.map((t, r) => (
						<div key={r} style={{display: 'flex', alignItems: 'center', height: rowH, gap: 10 * unit}}>
							<div style={{width: 56 * unit, fontFamily: FONT, fontWeight: 800, fontSize: 22 * unit, color: C.mute}}>{t.name}</div>
							<div style={{position: 'relative', flex: 1, height: rowH * 0.74, background: 'rgba(255,255,255,0.05)', borderRadius: 8 * unit}}>
								{t.clips.map(([a0, a1, label], k) => {
									const g = sp(f, 4 + r * 4 + k * 3, 14);
									return (
										<div key={k} style={{position: 'absolute', left: `${a0 * 100}%`, width: `${(a1 - a0) * 100 * g}%`, top: 0, bottom: 0, borderRadius: 8 * unit, background: cols[r % 4] + (r >= 2 ? '55' : 'cc'), border: `2px solid ${cols[r % 4]}`, overflow: 'hidden', fontFamily: FONT, fontWeight: 800, fontSize: 20 * unit, color: r >= 2 ? C.white : C.ink, paddingLeft: 8 * unit, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}}>
											{r >= 2 ? <span style={{opacity: 0.9}}>{'▁▃▅▇▅▃▁▂▄▆▄▂'.repeat(4)}</span> : label}
										</div>
									);
								})}
							</div>
						</div>
					))}
					<div style={{position: 'absolute', top: 0, bottom: 0, left: `calc(${66 * unit}px + (100% - ${66 * unit}px) * ${head})`, width: 4 * unit, background: '#FF3B30', boxShadow: '0 0 12px #FF3B30'}} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- photo-3d (2.5D parallax from a photo + its cut-out)
const Photo3D: React.FC<FxArgs> = ({p, f, d}) => {
	const k = f / Math.max(1, d);
	const o = inOut(f, d, 8, 8);
	const dir = p.direction ?? 1;
	return (
		<AbsoluteFill style={{opacity: o, overflow: 'hidden', background: C.ink}}>
			<Img src={staticFile(p.bg)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + 0.06 * k}) translateX(${dir * (k - 0.5) * -3}%)`, filter: 'blur(1.5px) brightness(0.85)'}} />
			<Img src={staticFile(p.fg)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + 0.16 * k}) translateX(${dir * (k - 0.5) * 4}%)`, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.5))'}} />
			{p.label ? <div style={{position: 'absolute', left: 0, right: 0, bottom: '14%', textAlign: 'center'}}><span style={{fontFamily: FONT, fontWeight: 900, fontSize: 72, color: C.ink, background: C.green, padding: '10px 34px', borderRadius: 999, display: 'inline-block', transform: `scale(${sp(f, 6)})`}}>{p.label}</span></div> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- map-flyto (any map image: fly to a point, drop a pin)
const MapFlyTo: React.FC<FxArgs> = ({p, f, d}) => {
	const {width, height} = useVideoConfig();
	const o = inOut(f, d, 8, 10);
	const fly = interpolate(f, [8, d * 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const zoom = 1 + (p.zoom ?? 3) * fly;
	// x, y are fractions of the MAP IMAGE; convert to the frame (image is drawn 'contain')
	const ar = p.aspect ?? 1;
	const dw = Math.min(width, height * ar), dh = dw / ar;
	const fx = ((width - dw) / 2 + (p.x ?? 0.5) * dw) / width, fy = ((height - dh) / 2 + (p.y ?? 0.5) * dh) / height;
	const tx = (0.5 - fx) * 100 * (zoom - 1) / zoom, ty = (0.5 - fy) * 100 * (zoom - 1) / zoom;
	const pin = sp(f, d * 0.6, 9, 0.6);
	return (
		<AbsoluteFill style={{opacity: o, background: p.bg ?? '#F1F4F7', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${zoom}) translate(${tx}%, ${ty}%)`}}>
				{p.image ? <Img src={staticFile(p.image)} style={{width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply'}} /> : null}
			</AbsoluteFill>
			<div style={{position: 'absolute', left: width / 2, top: height / 2, transform: `translate(-50%,-100%) scale(${pin})`, transformOrigin: 'bottom center', textAlign: 'center'}}>
				{p.label ? <div style={{fontFamily: FONT, fontWeight: 900, fontSize: width * 0.05, color: C.ink, background: C.yellow, padding: '6px 22px', borderRadius: 999, marginBottom: 10, whiteSpace: 'nowrap'}}>{p.label}</div> : null}
				<div style={{fontSize: width * 0.12, lineHeight: 1, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.5))'}}>📍</div>
			</div>
			<div style={{position: 'absolute', left: width / 2, top: height / 2, width: 40 + 260 * pin, height: (40 + 260 * pin) * 0.35, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: `4px solid ${C.green}`, opacity: Math.min(1, pin) * (1 - (f % 30) / 30)}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- registry
export const FX: Record<string, {comp: React.FC<FxArgs>; layers: ('behind' | 'front')[]}> = {
	'title-behind': {comp: TitleBehind, layers: ['behind']},
	'glass-widgets': {comp: GlassWidgets, layers: ['front']},
	spotlight: {comp: Spotlight, layers: ['front']},
	checklist: {comp: Checklist, layers: ['front']},
	'orbit-text': {comp: Orbit, layers: ['behind', 'front']},
	'money-counter': {comp: MoneyCounter, layers: ['front']},
	'iphone-ui': {comp: IPhoneUI, layers: ['front']},
	'news-cut': {comp: NewsCut, layers: ['front']},
	'freeze-callout': {comp: FreezeCallout, layers: ['front']},
	chart: {comp: Chart, layers: ['front']},
	transition: {comp: Transition, layers: ['front']},
	'edit-timeline': {comp: EditTimeline, layers: ['front']},
	'photo-3d': {comp: Photo3D, layers: ['front']},
	'map-flyto': {comp: MapFlyTo, layers: ['front']},
};

const CueView: React.FC<{cue: Cue; layer: 'behind' | 'front'; faces: Face[]; src?: string}> = ({cue, layer, faces, src}) => {
	const f = useCurrentFrame();
	const start = Math.round(cue.t * FPS);
	const d = Math.max(1, Math.round(cue.dur * FPS));
	const abs = start + f;
	const face = faces[Math.min(faces.length - 1, abs)] ?? null;
	const Comp = FX[cue.fx].comp;
	return <Comp p={cue.props ?? {}} f={f} d={d} layer={layer} face={face} abs={abs} src={src} t0={cue.t} />;
};

export const FxLayer: React.FC<FxLayerProps> = ({layer, cues, faces, src}) => (
	<AbsoluteFill>
		{cues
			.filter((c) => FX[c.fx] && FX[c.fx].layers.includes(layer))
			.map((c, i) => (
				<Sequence key={i} from={Math.round(c.t * FPS)} durationInFrames={Math.max(1, Math.round(c.dur * FPS))}>
					<CueView cue={c} layer={layer} faces={faces} src={src} />
				</Sequence>
			))}
	</AbsoluteFill>
);
