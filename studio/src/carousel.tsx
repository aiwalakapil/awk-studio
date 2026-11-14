// Instagram carousel: one composition renders every slide as a still (frame = slide index * SLIDE_F + hold),
// and the same composition plays as an animated "video carousel".
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND, C, FONT, sp, ramp} from './brand';

export type Slide =
	| {type: 'hook'; title: string; sub?: string; image?: string; chip?: string}
	| {type: 'point'; n?: number; title: string; body?: string; icon?: string; image?: string}
	| {type: 'list'; title: string; items: string[]}
	| {type: 'quote'; text: string; by?: string}
	| {type: 'compare'; title?: string; left: {head: string; items: string[]}; right: {head: string; items: string[]}}
	| {type: 'cta'; title: string; sub?: string; actions?: string[]};
export type CarouselProps = {slides: Slide[]; handle?: string; series?: string; slideSeconds?: number; plain?: boolean};
export const SLIDE_F = 90; // 3 s per slide in the video version

const Frame: React.FC<{i: number; n: number; handle: string; series?: string; plain?: boolean; children: React.ReactNode}> = ({i, n, handle, series, plain, children}) => {
	const {width} = useVideoConfig();
	const u = width / 1080;
	return (
		<AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
			<div style={{position: 'absolute', width: 1100 * u, height: 1100 * u, left: -300 * u, top: -500 * u, borderRadius: '50%', background: `radial-gradient(circle, ${C.green}40, transparent 62%)`}} />
			<div style={{position: 'absolute', width: 900 * u, height: 900 * u, right: -350 * u, bottom: -450 * u, borderRadius: '50%', background: `radial-gradient(circle, ${C.yellow}22, transparent 60%)`}} />
			<AbsoluteFill style={{padding: 80 * u, display: 'flex', flexDirection: 'column'}}>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30 * u, color: C.mute}}>
					<span>{series ?? ''}</span>
					{plain ? null : <span style={{color: C.green}}>{i + 1}/{n}</span>}
				</div>
				<div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>{children}</div>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30 * u, color: C.mute}}>
					<span>{handle}</span>
					{plain ? null : i < n - 1 ? <span style={{color: C.white}}>Swipe →</span> : <span style={{color: C.yellow}}>Save 🔖</span>}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const big = (u: number, size: number, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontWeight: 900, fontSize: size * u, lineHeight: 1.05, color, letterSpacing: -1});
const body = (u: number, size = 44): React.CSSProperties => ({fontFamily: FONT, fontWeight: 600, fontSize: size * u, lineHeight: 1.35, color: 'rgba(255,255,255,0.86)'});

const SlideView: React.FC<{s: Slide; f: number}> = ({s, f}) => {
	const {width} = useVideoConfig();
	const u = width / 1080;
	const a = (d: number) => ({opacity: sp(f, d, 14), transform: `translateY(${(1 - sp(f, d, 14)) * 40 * u}px)`});
	switch (s.type) {
		case 'hook':
			return (
				<div>
					{s.chip ? <div style={{...a(0), display: 'inline-block', padding: `${12 * u}px ${28 * u}px`, borderRadius: 999, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 32 * u, marginBottom: 30 * u}}>{s.chip}</div> : null}
					<div style={{...a(4), ...big(u, 104)}}>{s.title}</div>
					{s.sub ? <div style={{...a(10), ...body(u, 46), marginTop: 30 * u}}>{s.sub}</div> : null}
					{s.image ? <Img src={staticFile(s.image)} style={{...a(14), marginTop: 40 * u, width: '100%', height: 420 * u, objectFit: 'cover', borderRadius: 36 * u, border: `4px solid ${C.green}`}} /> : null}
				</div>
			);
		case 'point':
			return (
				<div>
					<div style={{...a(0), ...big(u, 220), color: 'transparent', WebkitTextStroke: `${4 * u}px ${C.green}`}}>{String(s.n ?? 1).padStart(2, '0')}</div>
					<div style={{...a(4), ...big(u, 80), marginTop: 10 * u}}>{s.icon ? `${s.icon} ` : ''}{s.title}</div>
					{s.body ? <div style={{...a(10), ...body(u), marginTop: 28 * u}}>{s.body}</div> : null}
					{s.image ? <Img src={staticFile(s.image)} style={{...a(14), marginTop: 36 * u, width: '100%', height: 380 * u, objectFit: 'cover', borderRadius: 32 * u}} /> : null}
				</div>
			);
		case 'list':
			return (
				<div>
					<div style={{...a(0), ...big(u, 76), marginBottom: 36 * u}}>{s.title}</div>
					{s.items.map((it, k) => (
						<div key={k} style={{...a(6 + k * 4), display: 'flex', gap: 24 * u, alignItems: 'flex-start', padding: `${18 * u}px 0`, borderBottom: `2px solid ${C.glassLine}`}}>
							<div style={{minWidth: 64 * u, height: 64 * u, borderRadius: 18 * u, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 36 * u, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{k + 1}</div>
							<div style={{...body(u, 44), color: C.white, fontWeight: 700}}>{it}</div>
						</div>
					))}
				</div>
			);
		case 'quote':
			return (
				<div>
					<div style={{...a(0), ...big(u, 200), color: C.green, lineHeight: 0.6}}>“</div>
					<div style={{...a(4), ...big(u, 72)}}>{s.text}</div>
					{s.by ? <div style={{...a(10), ...body(u, 40), marginTop: 30 * u, color: C.yellow}}>— {s.by}</div> : null}
				</div>
			);
		case 'compare': {
			const col = (h: {head: string; items: string[]}, good: boolean, d: number) => (
				<div style={{...a(d), flex: 1, padding: 34 * u, borderRadius: 32 * u, background: good ? `${C.green}22` : 'rgba(255,77,94,0.12)', border: `3px solid ${good ? C.green : C.red}`}}>
					<div style={{...big(u, 48, good ? C.green : C.red), marginBottom: 20 * u}}>{good ? '✅ ' : '❌ '}{h.head}</div>
					{h.items.map((it, k) => <div key={k} style={{...body(u, 36), padding: `${10 * u}px 0`}}>{it}</div>)}
				</div>
			);
			return (
				<div>
					{s.title ? <div style={{...a(0), ...big(u, 70), marginBottom: 34 * u}}>{s.title}</div> : null}
					<div style={{display: 'flex', gap: 28 * u}}>{col(s.left, false, 4)}{col(s.right, true, 8)}</div>
				</div>
			);
		}
		case 'cta':
			return (
				<div style={{textAlign: 'center'}}>
					<div style={{...a(0), ...big(u, 92)}}>{s.title}</div>
					{s.sub ? <div style={{...a(6), ...body(u, 44), marginTop: 26 * u}}>{s.sub}</div> : null}
					<div style={{display: 'flex', justifyContent: 'center', gap: 22 * u, marginTop: 50 * u, flexWrap: 'wrap'}}>
						{(s.actions ?? ['🔖 Save', '↗ Share', '➕ Follow']).map((x, k) => (
							<div key={k} style={{...a(10 + k * 4), padding: `${20 * u}px ${36 * u}px`, borderRadius: 999, background: k === 0 ? C.green : 'rgba(255,255,255,0.1)', color: k === 0 ? C.ink : C.white, fontFamily: FONT, fontWeight: 900, fontSize: 40 * u, border: `2px solid ${k === 0 ? C.green : C.glassLine}`}}>{x}</div>
						))}
					</div>
				</div>
			);
	}
};

export const Carousel: React.FC<CarouselProps> = ({slides, handle, series, plain}) => {
	const f = useCurrentFrame();
	const {width} = useVideoConfig();
	const h = handle ?? BRAND.role.split('·').pop()?.trim() ?? '';
	return (
		<AbsoluteFill style={{background: C.ink}}>
			{slides.map((s, i) => {
				const local = f - i * SLIDE_F;
				// slide-in from the right like a swipe
				const enter = i === 0 ? 1 : ramp(local, 0, 12);
				const leave = ramp(local, SLIDE_F - 12, SLIDE_F);
				const x = i === slides.length - 1 ? (1 - enter) * width : (1 - enter) * width - leave * width;
				return (
					<Sequence key={i} from={i * SLIDE_F - (i === 0 ? 0 : 12)} durationInFrames={SLIDE_F + 12 + (i === slides.length - 1 ? 60 : 0)}>
						<AbsoluteFill style={{transform: `translateX(${interpolate(x, [-width, width], [-width, width])}px)`}}>
							<Frame i={i} n={slides.length} handle={h} series={series} plain={plain}>
								<SlideView s={s} f={Math.max(0, local - 6)} />
							</Frame>
						</AbsoluteFill>
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
