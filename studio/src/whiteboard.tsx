// Whiteboard explainer: SVG doodles drawn on with a dash trick, words "written" left to right,
// a marker hand that follows the pen tip, a camera that pans between pages, marker sound while drawing.
// Everything comes from props (built by skills/awk-whiteboard/scripts/whiteboard.py).
import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {loadFont} from '@remotion/google-fonts/Kalam';

const HAND = loadFont('normal', {weights: ['400', '700'], subsets: ['latin', 'devanagari']}).fontFamily;
const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.55, 1);
const INK = '#1d1d1f';

export type WBPath = {kind: 'path'; a: number; b: number; d: string; color?: string; w?: number; tx?: number; ty?: number; sc?: number};
export type WBText = {kind: 'text'; a: number; b: number; text: string; x: number; y: number; size: number; color?: string; weight?: number};
export type WBItem = WBPath | WBText;
export type WhiteboardProps = {items: WBItem[]; pages?: number[]; voice?: string; footnote?: string; duration: number; width: number; height: number; marker?: boolean};

const textWidth = (t: WBText) => [...t.text].length * t.size * (t.weight === 700 ? 0.5 : 0.46);
const prog = (f: number, it: WBItem) => interpolate(f, [s(it.a), s(it.b)], [0, 1], {...clamp, easing: ease});
const tipOf = (it: WBItem, p: number): [number, number] => {
	if (it.kind === 'text') return [it.x + textWidth(it) * p, it.y - it.size * 0.28 + Math.sin(p * 40) * it.size * 0.12];
	const L = getLength(it.d);
	const pt = getPointAtLength(it.d, Math.max(0.01, L * p)) ?? {x: 0, y: 0};
	const sc = it.sc ?? 1;
	return [(it.tx ?? 0) + pt.x * sc, (it.ty ?? 0) + pt.y * sc];
};

const PathDraw: React.FC<{it: WBPath; f: number}> = ({it, f}) => {
	const p = prog(f, it);
	if (p <= 0) return null;
	const L = getLength(it.d);
	const sc = it.sc ?? 1;
	const c = it.color ?? INK;
	return (
		<g transform={`translate(${it.tx ?? 0} ${it.ty ?? 0}) scale(${sc})`}>
			<path d={it.d} fill="none" stroke={c} strokeWidth={(it.w ?? 8) / sc} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
			<path d={it.d} fill="none" stroke={c} strokeWidth={((it.w ?? 8) * 0.45) / sc} strokeLinecap="round" opacity={0.35} transform="translate(2 -2)" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
		</g>
	);
};

const TextDraw: React.FC<{it: WBText; f: number; id: string}> = ({it, f, id}) => {
	const p = prog(f, it);
	if (p <= 0) return null;
	const w = p >= 1 ? 6000 : textWidth(it) * p;
	return (
		<g>
			<defs><clipPath id={id}><rect x={it.x - 20} y={it.y - it.size * 1.3} width={w + 20} height={it.size * 1.8} /></clipPath></defs>
			<text x={it.x} y={it.y} fontFamily={HAND} fontWeight={it.weight ?? 400} fontSize={it.size} fill={it.color ?? INK} clipPath={`url(#${id})`}>{it.text}</text>
		</g>
	);
};

const MarkerHand: React.FC<{x: number; y: number; color: string}> = ({x, y, color}) => (
	<g transform={`translate(${x} ${y})`}>
		<g transform="rotate(32)">
			<polygon points="0,0 26,-11 26,11" fill={color} />
			<rect x={24} y={-17} width={200} height={34} rx={10} fill="#2f3542" stroke="#111" strokeWidth={3} />
			<rect x={170} y={-17} width={22} height={34} fill={color} />
			<ellipse cx={150} cy={22} rx={78} ry={46} fill="#F2C29B" stroke="#1a1a1a" strokeWidth={4} />
			<ellipse cx={92} cy={-14} rx={34} ry={20} fill="#F2C29B" stroke="#1a1a1a" strokeWidth={4} />
			<ellipse cx={96} cy={30} rx={30} ry={18} fill="#F2C29B" stroke="#1a1a1a" strokeWidth={4} />
			<path d="M 200 50 Q 260 70 300 140" fill="none" stroke="#F2C29B" strokeWidth={70} strokeLinecap="round" />
			<path d="M 200 50 Q 260 70 300 140" fill="none" stroke="#5b8def" strokeWidth={70} strokeLinecap="butt" strokeDasharray="1 200" />
		</g>
	</g>
);

const BoardBg: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 85% at 50% 45%, #ffffff 0%, #f1f1ee 80%, #e4e4df 100%)'}}>
		<svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.08}}>
			<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /></filter>
			<rect width="100%" height="100%" filter="url(#grain)" />
		</svg>
	</AbsoluteFill>
);

export const Whiteboard: React.FC<WhiteboardProps> = ({items, pages = [], voice, footnote, marker = true}) => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	// camera: page n starts at pages[n-1] seconds; each page is one frame-width to the right
	let camX = 0;
	pages.forEach((at, i) => {
		camX += interpolate(f, [s(at), s(at + 0.6)], [0, -width], {...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1)});
	});
	const active = items.find((it) => f >= s(it.a) && f < s(it.b));
	let hand: [number, number] | null = null;
	let fade = 1;
	if (active) hand = tipOf(active, prog(f, active));
	else {
		const done = items.filter((it) => f >= s(it.b)).sort((a, b) => b.b - a.b)[0];
		if (done && f - s(done.b) < 12) {
			const [x, y] = tipOf(done, 1);
			const k = (f - s(done.b)) / 12;
			hand = [x + k * 120, y + k * 160];
			fade = 1 - k;
		}
	}
	const drawing = (fr: number) => items.some((it) => fr >= s(it.a) && fr < s(it.b));
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<BoardBg />
			<svg width={width * (pages.length + 1)} height={height} style={{position: 'absolute', left: camX, top: 0}}>
				{items.map((it, i) => (it.kind === 'path' ? <PathDraw key={i} it={it} f={f} /> : <TextDraw key={i} it={it} f={f} id={`wbt${i}`} />))}
				{hand ? <g opacity={fade}><MarkerHand x={hand[0]} y={hand[1]} color={active?.color ?? INK} /></g> : null}
			</svg>
			{footnote ? <div style={{position: 'absolute', right: 30, bottom: 16, fontFamily: HAND, fontSize: Math.round(width * 0.0125), color: '#666'}}>{footnote}</div> : null}
			{voice ? <Audio src={staticFile(voice)} /> : null}
			{marker ? <Audio src={staticFile('sfx/marker.wav')} loop volume={(fr) => (drawing(fr) ? 0.4 : 0)} /> : null}
		</AbsoluteFill>
	);
};
