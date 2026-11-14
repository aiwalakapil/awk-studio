// Course Look pack: every lecture reuses these. 1920x1080 unless noted.
// Overlays (StepBadge, WinBurst, LowerThird) have a transparent background so they
// can sit on top of OBS scenes or any edit.
import React from 'react';
import {AbsoluteFill, Img, getStaticFiles, interpolate, staticFile, useCurrentFrame, useVideoConfig, random} from 'remotion';

const has = (p: string) => getStaticFiles().some((f) => f.name === p);

/** Round photo from brand.json, or initials in a ring if the file is missing. */
export const Avatar: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) =>
	has(BRAND.avatar) ? (
		<Img src={staticFile(BRAND.avatar)} style={{width: size, height: size, ...style}} />
	) : (
		<div style={{width: size, height: size, borderRadius: '50%', border: `${Math.max(3, size * 0.03)}px solid ${C.green}`, background: `radial-gradient(circle, ${C.greenDeep}, ${C.ink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size * 0.42, color: C.white, ...style}}>
			{BRAND.name.slice(0, 1).toUpperCase()}
		</div>
	);

/** Cut-out photo, or a big avatar if there is no cut-out. */
const Cutout: React.FC<{style: React.CSSProperties}> = ({style}) =>
	has(BRAND.cutout) ? <Img src={staticFile(BRAND.cutout)} style={{height: 760, ...style}} /> : <Avatar size={460} style={{...style, bottom: 160}} />;
import {BRAND, C, FONT, sp, ramp, glassPanel} from './brand';

// ---------- shared bits ----------

export const BrandBg: React.FC<{tint?: string}> = ({tint = C.green}) => {
	const f = useCurrentFrame();
	const drift = Math.sin(f / 40) * 40;
	return (
		<AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
			<div style={{position: 'absolute', width: 1400, height: 1400, left: -300 + drift, top: -700, borderRadius: '50%', background: `radial-gradient(circle, ${tint}55 0%, transparent 62%)`}} />
			<div style={{position: 'absolute', width: 1200, height: 1200, right: -400 - drift, bottom: -700, borderRadius: '50%', background: `radial-gradient(circle, ${C.yellow}22 0%, transparent 60%)`}} />
			{/* fine grid */}
			<AbsoluteFill style={{backgroundImage: `linear-gradient(${C.glassLine} 1px, transparent 1px), linear-gradient(90deg, ${C.glassLine} 1px, transparent 1px)`, backgroundSize: '80px 80px', opacity: 0.18, transform: `translateY(${(f * 0.6) % 80}px)`}} />
			{/* vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)'}} />
		</AbsoluteFill>
	);
};

const Chip: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = C.green, size = 34}) => (
	<div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: `${size * 0.35}px ${size * 0.8}px`, borderRadius: 999, background: color, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 2}}>
		{children}
	</div>
);

/** letters rise in one by one */
const Rise: React.FC<{text: string; delay?: number; size: number; color?: string; weight?: number}> = ({text, delay = 0, size, color = C.white, weight = 900}) => {
	const f = useCurrentFrame();
	const words = text.split(' ');
	let k = 0;
	return (
		<div style={{fontFamily: FONT, fontSize: size, fontWeight: weight, color, lineHeight: 1.08, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.28}}>
			{words.map((w, wi) => (
				<span key={wi} style={{display: 'inline-flex', overflow: 'hidden', paddingBottom: size * 0.12}}>
					{[...w].map((ch, ci) => {
						const p = sp(f, delay + (k++) * 1.2, 15);
						return <span key={ci} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`, opacity: p}}>{ch}</span>;
					})}
				</span>
			))}
		</div>
	);
};

// ---------- 1. Intro sting (3 s) ----------
export const IntroSting: React.FC = () => {
	const f = useCurrentFrame();
	const ring = ramp(f, 0, 24);
	const logo = sp(f, 8, 11);
	const out = ramp(f, 76, 90);
	return (
		<AbsoluteFill style={{opacity: 1 - out}}>
			<BrandBg />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{position: 'absolute', width: 700 * ring, height: 700 * ring, borderRadius: '50%', border: `6px solid ${C.green}`, opacity: 1 - ring * 0.7, boxShadow: `0 0 80px ${C.green}`}} />
				<div style={{transform: `scale(${0.6 + logo * 0.4})`, opacity: logo, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					<Avatar size={260} style={{marginBottom: 20, transform: `scale(${sp(f, 4, 9)})`, filter: `drop-shadow(0 0 40px ${C.green}88)`}} />
					<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 130, color: C.white, letterSpacing: -2, textShadow: `0 0 50px ${C.green}88`}}>
						{BRAND.title[0]} <span style={{color: C.green}}>{BRAND.title[1] ?? ''}</span>
					</div>
					<div style={{marginTop: 18, opacity: ramp(f, 30, 45)}}>
						<Chip size={36}>{BRAND.tagline}</Chip>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- 2. Title card (5 s) ----------
export type TitleProps = {lecture: number; title: string; result: string; part?: string; label?: string; resultLabel?: string};
export const TitleCard: React.FC<TitleProps> = ({lecture, title, result, part = '', label, resultLabel = 'Aaj ka result:'}) => {
	const f = useCurrentFrame();
	const num = sp(f, 0, 10);
	const bar = ramp(f, 20, 45);
	return (
		<AbsoluteFill>
			<BrandBg />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: 120}}>
				<div style={{transform: `scale(${num})`, opacity: num}}>
					<Chip size={40}>{label ?? `LECTURE ${String(lecture).padStart(2, '0')}`}{part ? ` · ${part}` : ''}</Chip>
				</div>
				<div style={{height: 40}} />
				<Rise text={title} delay={10} size={118} />
				<div style={{width: 900 * bar, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${C.green}, ${C.yellow})`, margin: '36px 0'}} />
				<div style={{opacity: ramp(f, 40, 55), transform: `translateY(${(1 - ramp(f, 40, 55)) * 30}px)`, fontFamily: FONT, fontSize: 48, fontWeight: 700, color: C.mute}}>
					{resultLabel ? `${resultLabel} ` : ''}<span style={{color: C.yellow}}>{result}</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- 3. Chapter card (2.5 s, wipe in + wipe out) ----------
export type ChapterProps = {step: number; total: number; title: string};
export const ChapterCard: React.FC<ChapterProps> = ({step, total, title}) => {
	const f = useCurrentFrame();
	const {durationInFrames: d} = useVideoConfig();
	const inW = ramp(f, 0, 12);
	const outW = ramp(f, d - 12, d);
	const clip = `polygon(${(outW) * 120 - 20}% 0, ${inW * 120}% 0, ${inW * 120 - 20}% 100%, ${(outW) * 120 - 40}% 100%)`;
	return (
		<AbsoluteFill style={{clipPath: clip}}>
			<BrandBg tint={C.yellow} />
			<AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 180}}>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 260, color: 'transparent', WebkitTextStroke: `4px ${C.green}`, lineHeight: 0.9, opacity: ramp(f, 4, 14)}}>
					{String(step).padStart(2, '0')}
				</div>
				<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.green, letterSpacing: 6, marginTop: 10}}>STEP {step}/{total}</div>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 96, color: C.white, marginTop: 8, transform: `translateX(${(1 - sp(f, 8)) * -80}px)`, opacity: sp(f, 8)}}>{title}</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- 4. Step badge overlay (transparent, loops / holds) ----------
export const StepBadge: React.FC<ChapterProps> = ({step, total, title}) => {
	const f = useCurrentFrame();
	const p = sp(f, 0, 13);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 48, top: 44, display: 'flex', alignItems: 'center', gap: 18, padding: '16px 30px 16px 16px', borderRadius: 24, ...glassPanel, transform: `translateX(${(1 - p) * -120}%)`}}>
				<div style={{width: 74, height: 74, borderRadius: 18, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{step}</div>
				<div>
					<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 22, color: C.green, letterSpacing: 3}}>STEP {step}/{total}</div>
					<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.white}}>{title}</div>
				</div>
				{/* progress */}
				<div style={{position: 'absolute', left: 16, right: 16, bottom: 8, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.12)'}}>
					<div style={{width: `${(step / total) * 100 * ramp(f, 6, 30)}%`, height: '100%', borderRadius: 3, background: C.green}} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------- 5. Win burst (transparent, 3 s) ----------
export const WinBurst: React.FC<{text?: string; sub?: string}> = ({text = 'PROUD MOMENT!', sub = 'Tumne bana liya ✅'}) => {
	const f = useCurrentFrame();
	const pop = sp(f, 2, 9, 0.6);
	const fade = 1 - ramp(f, 72, 90);
	const bits = Array.from({length: 70}, (_, i) => {
		const a = random(`a${i}`) * Math.PI * 2;
		const v = 18 + random(`v${i}`) * 26;
		const t = Math.max(0, f - 2);
		const x = Math.cos(a) * v * t;
		const y = Math.sin(a) * v * t + 0.9 * t * t;
		const col = [C.green, C.yellow, C.white, '#7CF5C8'][i % 4];
		const s = 10 + random(`s${i}`) * 16;
		return <div key={i} style={{position: 'absolute', left: 960 + x, top: 470 + y, width: s, height: s * 0.5, background: col, borderRadius: 3, transform: `rotate(${t * (8 + i)}deg)`, opacity: Math.max(0, 1 - t / 60)}} />;
	});
	return (
		<AbsoluteFill style={{opacity: fade}}>
			<AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${C.green}33 0%, transparent ${25 + pop * 20}%)`}} />
			{bits}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{transform: `scale(${pop}) rotate(${(1 - pop) * -8}deg)`, textAlign: 'center'}}>
					<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 140, color: C.yellow, WebkitTextStroke: `6px ${C.ink}`, paintOrder: 'stroke', filter: `drop-shadow(0 10px 0 ${C.ink}) drop-shadow(0 0 30px ${C.yellow}88)`}}>{text}</div>
					<div style={{display: 'inline-block', marginTop: 16, padding: '14px 36px', borderRadius: 999, background: C.ink, color: C.green, border: `4px solid ${C.green}`, fontFamily: FONT, fontWeight: 900, fontSize: 52, opacity: ramp(f, 14, 24)}}>{sub}</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- 6. Phone → Laptop switch card (3 s) ----------
export const PhoneToLaptop: React.FC = () => {
	const f = useCurrentFrame();
	const left = sp(f, 0);
	const tick = sp(f, 14, 8);
	const arrow = ramp(f, 30, 48);
	const right = sp(f, 40);
	const icon = (emoji: string, label: string, p: number, extra?: React.ReactNode) => (
		<div style={{width: 620, height: 520, borderRadius: 48, ...glassPanel, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.7 + p * 0.3})`, opacity: p, position: 'relative'}}>
			<div style={{fontSize: 200}}>{emoji}</div>
			<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.white, marginTop: 10, textAlign: 'center', padding: '0 30px'}}>{label}</div>
			{extra}
		</div>
	);
	return (
		<AbsoluteFill>
			<BrandBg />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 70}}>
				{icon('📱', 'Phone wale yahan tak', left,
					<div style={{position: 'absolute', top: -36, right: -36, width: 120, height: 120, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70, transform: `scale(${tick})`, color: C.ink, fontWeight: 900}}>✓</div>)}
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 140, color: C.green, opacity: arrow, transform: `translateX(${(arrow - 1) * 60}px)`}}>→</div>
				{icon('💻', 'Ab laptop wale', right)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- 7. Lower third (transparent, 5 s) ----------
export const LowerThird: React.FC<{name: string; role: string}> = ({name, role}) => {
	const f = useCurrentFrame();
	const {durationInFrames: d} = useVideoConfig();
	const inn = sp(f, 0, 14);
	const out = ramp(f, d - 12, d);
	const w = interpolate(inn, [0, 1], [0, 1]) * (1 - out);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 80, bottom: 150, overflow: 'hidden', width: 900 * w, borderRadius: 20}}>
				<div style={{width: 900, padding: '18px 34px 18px 18px', ...glassPanel, borderLeft: `12px solid ${C.green}`, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 24}}>
					<Avatar size={110} />
					<div>
					<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 54, color: C.white}}>{name}</div>
					<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.green}}>{role}</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------- 8. End card (6 s) ----------
export const EndCard: React.FC<{next: string}> = ({next}) => {
	const f = useCurrentFrame();
	const sub = sp(f, 10, 9);
	const pulse = 1 + Math.sin(f / 5) * 0.03;
	return (
		<AbsoluteFill>
			<BrandBg />
			<Cutout style={{position: 'absolute', left: 40, bottom: 0, transform: `translateY(${(1 - sp(f, 0, 14)) * 400}px)`, filter: `drop-shadow(0 0 50px ${C.green}66)`}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 50, paddingLeft: 640}}>
				<Rise text="Aaj tumne bana liya!" size={92} />
				<div style={{transform: `scale(${sub * pulse})`, padding: '28px 70px', borderRadius: 999, background: '#FF0033', color: C.white, fontFamily: FONT, fontWeight: 900, fontSize: 64, boxShadow: '0 20px 60px rgba(255,0,51,0.45)'}}>🔔 SUBSCRIBE</div>
				<div style={{opacity: ramp(f, 30, 45), fontFamily: FONT, fontWeight: 800, fontSize: 48, color: C.mute}}>
					Agli class: <span style={{color: C.green}}>{next}</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
