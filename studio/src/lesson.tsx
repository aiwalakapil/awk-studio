// Lesson engine: a narrated class part = audio + timed "beats" (scenes) + word-highlight captions.
// Built for Class 0 but generic: every beat type below is reusable for other classes.
import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {C, FONT, FPS, ramp, sp} from './brand';
import {BrandBg} from './look';
import {CaptionLine, Chunk} from './clips';

type Media = {src: string; from?: number; image?: boolean};
export type Beat = {t: number; end?: number; type: string; p: Record<string, any>};
export type LessonProps = {audio?: string; duration: number; beats: Beat[]; chunks: Chunk[]; captions?: boolean};

const glass: React.CSSProperties = {background: 'rgba(14,31,24,0.72)', border: '2px solid rgba(255,255,255,0.16)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderRadius: 32};
const MediaView: React.FC<{m: Media; style?: React.CSSProperties}> = ({m, style}) =>
	m.image ? <Img src={staticFile(m.src)} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} /> : <OffthreadVideo src={staticFile(m.src)} startFrom={Math.round((m.from ?? 0) * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />;
const H = (size: number, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontWeight: 900, fontSize: size, color, lineHeight: 1.08});
const useLocal = () => useCurrentFrame() / FPS;
const pop = (f: number, d = 0) => sp(f, d, 12, 0.7);

// ---------------------------------------------------------------- beats
const Hero: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: 140, textAlign: 'center'}}>
			{p.chip ? <div style={{transform: `scale(${pop(f)})`, padding: '12px 30px', borderRadius: 999, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 36, marginBottom: 30}}>{p.chip}</div> : null}
			{p.emoji ? <div style={{fontSize: 140, transform: `scale(${pop(f, 2)})`}}>{p.emoji}</div> : null}
			<div style={{...H(p.size ?? 110), opacity: pop(f, 4), transform: `translateY(${(1 - pop(f, 4)) * 40}px)`}}>{p.title}</div>
			{p.sub ? <div style={{...H(48, C.yellow), fontWeight: 700, marginTop: 26, opacity: ramp(f, 12, 24)}}>{p.sub}</div> : null}
		</AbsoluteFill>
	);
};

const Counter: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	const v = interpolate(f, [4, 40], [p.from ?? 0, p.to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{...H(56, C.mute), fontWeight: 800}}>{p.label}</div>
			<div style={{...H(260, C.green), filter: `drop-shadow(0 0 40px ${C.green}77)`}}>{Math.round(v).toLocaleString('en-IN')}{p.suffix ?? ''}</div>
			{p.sub ? <div style={{...H(52), opacity: ramp(f, 40, 52)}}>{p.sub}</div> : null}
		</AbsoluteFill>
	);
};

const Ticks: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	const n = p.n ?? 5;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 50}}>
			<div style={{display: 'flex', gap: 26}}>
				{Array.from({length: n}, (_, i) => {
					const s = pop(f, 4 + i * 5);
					return <div key={i} style={{width: 120, height: 120, borderRadius: '50%', background: C.green, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, fontWeight: 900, transform: `scale(${s})`, boxShadow: `0 0 30px ${C.green}88`}}>✓</div>;
				})}
			</div>
			<div style={{...glass, padding: '34px 70px', textAlign: 'center', transform: `scale(${pop(f, 6 + n * 5)})`, border: `4px solid ${p.gold ? '#E9B949' : C.green}`}}>
				<div style={{...H(40, p.gold ? '#E9B949' : C.green), letterSpacing: 4}}>{p.gold ? 'GOLD CERTIFICATE 🏆' : 'BOOTCAMP CERTIFICATE 🎓'}</div>
				<div style={{...H(64), marginTop: 8}}>{p.label}</div>
			</div>
		</AbsoluteFill>
	);
};

const Credits: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	const names: string[] = p.names ?? [];
	const y = interpolate(f, [0, (p.dur ?? 4) * FPS], [700, -names.length * 70 + 200]);
	return (
		<AbsoluteFill style={{alignItems: 'center', overflow: 'hidden'}}>
			<div style={{position: 'absolute', top: 70, ...H(52, C.green), letterSpacing: 6}}>FOUNDING BATCH 2026</div>
			<div style={{position: 'absolute', top: y, textAlign: 'center'}}>
				{names.map((n, i) => <div key={i} style={{...H(46), fontWeight: 700, height: 70, opacity: 0.9}}>{n}</div>)}
			</div>
			<AbsoluteFill style={{background: `linear-gradient(${C.ink} 12%, transparent 30%, transparent 75%, ${C.ink} 95%)`}} />
		</AbsoluteFill>
	);
};

const Montage: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	const items: Media[] = p.items ?? [];
	const unlocked = p.unlockAt != null && f / FPS >= p.unlockAt;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 40}}>
			<div style={{...H(64), opacity: pop(f)}}>{p.title}</div>
			<div style={{display: 'flex', gap: 30}}>
				{items.map((m, i) => (
					<div key={i} style={{width: 360, height: 640, borderRadius: 30, overflow: 'hidden', border: `5px solid ${C.white}`, position: 'relative', transform: `translateY(${(1 - pop(f, 4 + i * 4)) * 120}px) rotate(${(i - 1) * 3}deg)`, boxShadow: '0 30px 70px rgba(0,0,0,0.5)'}}>
						<MediaView m={m} />
						{p.locked && !unlocked ? <AbsoluteFill style={{background: 'rgba(6,17,13,0.45)', alignItems: 'center', justifyContent: 'center', fontSize: 120}}>🔒</AbsoluteFill> : null}
					</div>
				))}
			</div>
			{p.badge ? <div style={{padding: '14px 36px', borderRadius: 999, background: C.yellow, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 42, transform: `scale(${pop(f, 18)})`}}>{p.badge}</div> : null}
		</AbsoluteFill>
	);
};

// Day 0 → 25: timeline on the left, the day's best example on the right
const Roadmap: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const days: {day: string; title: string; at: number; media?: Media; tag?: string}[] = p.days;
	let cur = 0;
	days.forEach((d, i) => { if (t >= d.at) cur = i; });
	const d = days[cur];
	const local = (t - d.at) * FPS;
	const rowH = 860 / days.length;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 70, top: 40, width: 640}}>
				{days.map((x, i) => {
					const on = i === cur, done = i < cur;
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, height: rowH, opacity: on ? 1 : done ? 0.75 : 0.35}}>
							<div style={{width: on ? 30 : 18, height: on ? 30 : 18, borderRadius: '50%', background: on || done ? C.green : 'rgba(255,255,255,0.3)', boxShadow: on ? `0 0 24px ${C.green}` : 'none', flexShrink: 0}} />
							<div style={{fontFamily: FONT, fontWeight: 900, fontSize: on ? 34 : 26, color: on ? C.yellow : C.white, width: 190, flexShrink: 0}}>{x.day}</div>
							<div style={{fontFamily: FONT, fontWeight: on ? 900 : 700, fontSize: on ? 34 : 26, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{x.title}</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 760, top: 50, width: 1100, height: 830, ...glass, overflow: 'hidden'}}>
				{d.media ? (
					<Sequence key={cur} from={Math.round(d.at * FPS)} layout="none">
						<div style={{position: 'absolute', inset: 0, transform: `scale(${1.04 - 0.04 * Math.min(1, local / 20)})`, opacity: Math.min(1, local / 8)}}>
							<MediaView m={d.media} style={{objectFit: d.media.image ? 'cover' : 'contain', background: '#000'}} />
						</div>
					</Sequence>
				) : null}
				<div style={{position: 'absolute', left: 30, top: 26, padding: '10px 26px', borderRadius: 999, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 34}}>{d.day}{d.tag ? ` · ${d.tag}` : ''}</div>
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '60px 34px 26px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', ...H(50)}}>{d.title}</div>
			</div>
		</AbsoluteFill>
	);
};

const Phone: React.FC<{children: React.ReactNode; x?: number; scale?: number}> = ({children, x = 960, scale = 1}) => (
	<div style={{position: 'absolute', left: x - 230 * scale, top: 90, width: 460 * scale, height: 900 * scale, borderRadius: 64 * scale, background: '#0b0b0d', border: `${10 * scale}px solid #2a2d33`, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', overflow: 'hidden'}}>
		<div style={{position: 'absolute', top: 14 * scale, left: '50%', transform: 'translateX(-50%)', width: 120 * scale, height: 32 * scale, borderRadius: 20, background: '#000', zIndex: 3}} />
		{children}
	</div>
);

const Apps: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const items: {name: string; emoji: string; color: string; at: number; note?: string}[] = p.items;
	return (
		<AbsoluteFill>
			<Phone x={560}>
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1c3b30,#0b1712)', padding: '110px 40px'}}>
					<div style={{...H(30, C.mute), fontWeight: 700, marginBottom: 30}}>Install karo 👇</div>
					{items.map((it, i) => {
						const s = sp((t - it.at) * FPS, 0, 12, 0.6);
						return (
							<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 34, opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 80}px)`}}>
								<div style={{width: 110, height: 110, borderRadius: 28, background: it.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 62}}>{it.emoji}</div>
								<div>
									<div style={H(40)}>{it.name}</div>
									<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 24, color: t > it.at + 1.2 ? C.green : C.mute}}>{t > it.at + 1.2 ? '✓ Installed' : 'Get'}</div>
								</div>
							</div>
						);
					})}
				</div>
			</Phone>
			{items.filter((it) => it.note && t >= it.at + 0.5).slice(-1).map((it, i) => (
				<div key={i} style={{position: 'absolute', left: 900, top: 380, width: 880, padding: 40, ...glass, transform: `scale(${pop((t - it.at - 0.5) * FPS)})`}}>
					<div style={H(46, C.yellow)}>{it.name}</div>
					<div style={{...H(40), fontWeight: 700, marginTop: 12}}>{it.note}</div>
				</div>
			))}
		</AbsoluteFill>
	);
};

const Browser: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const urls: {text: string; at: number}[] = p.urls;
	const cur = [...urls].reverse().find((u) => t >= u.at) ?? urls[0];
	const n = Math.floor(Math.max(0, (t - cur.at) * 14));
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: 1400, height: 800, borderRadius: 26, background: '#f4f6f5', overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}}>
				<div style={{height: 70, background: '#dfe5e2', display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px'}}>
					{['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 18, height: 18, borderRadius: '50%', background: c}} />)}
					<div style={{marginLeft: 20, flex: 1, height: 42, borderRadius: 21, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 22px', fontFamily: 'Menlo, monospace', fontSize: 26, color: '#222'}}>{cur.text.slice(0, n)}<span style={{opacity: Math.floor(t * 2) % 2 ? 1 : 0}}>|</span></div>
				</div>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 730, ...H(64, '#14201b')}}>{n >= cur.text.length ? `✓ ${cur.text}` : ''}</div>
			</div>
			{p.note ? <div style={{position: 'absolute', bottom: 150, padding: '14px 36px', borderRadius: 999, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 40}}>{p.note}</div> : null}
		</AbsoluteFill>
	);
};

const Card: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: 1300, padding: '50px 60px', ...glass, transform: `scale(${pop(f)})`}}>
				{p.icon ? <div style={{fontSize: 90}}>{p.icon}</div> : null}
				<div style={H(70, p.color ?? C.green)}>{p.title}</div>
				{p.body ? <div style={{...H(46), fontWeight: 700, marginTop: 18, whiteSpace: 'pre-wrap'}}>{p.body}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

const Chat: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const typed = p.prompt.slice(0, Math.floor(Math.max(0, t - (p.typeAt ?? 0.3)) * 40));
	const answers: {at: number; title: string; lines: string[]}[] = p.answers ?? [];
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 160, top: 60, width: 1600, height: 880, borderRadius: 30, background: '#1f1e1d', overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}}>
				<div style={{height: 70, display: 'flex', alignItems: 'center', padding: '0 30px', fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#e8e2d9', borderBottom: '1px solid #333'}}>✳︎ Claude</div>
				<div style={{padding: 34, display: 'flex', flexDirection: 'column', gap: 22}}>
					<div style={{alignSelf: 'flex-end', maxWidth: 1100, background: '#3a3835', color: '#f3eee7', borderRadius: 22, padding: '18px 24px', fontFamily: FONT, fontSize: 28, lineHeight: 1.35, minHeight: 40}}>{typed}{typed.length < p.prompt.length ? <span style={{opacity: Math.floor(t * 2) % 2}}>▍</span> : null}</div>
					{answers.filter((a) => t >= a.at).slice(-1).map((a, k) => {
						const shown = Math.floor((t - a.at) * 3);
						return (
							<div key={k} style={{color: '#efe9e0', fontFamily: FONT, fontSize: 30, lineHeight: 1.45}}>
								<div style={{fontWeight: 900, color: '#d97757', marginBottom: 10}}>{a.title}</div>
								{a.lines.slice(0, shown).map((l, i) => <div key={i} style={{padding: '8px 14px', margin: '6px 0', borderRadius: 12, background: i < 3 ? 'rgba(0,229,143,0.12)' : 'transparent', borderLeft: i < 3 ? `5px solid ${C.green}` : 'none'}}>{l}</div>)}
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Split: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const side = (m: Media & {label: string; color: string}, x: number, show: boolean) => (
		<div style={{position: 'absolute', left: x, top: 80, width: 470, height: 840, borderRadius: 30, overflow: 'hidden', border: `6px solid ${m.color}`, opacity: show ? 1 : 0.25, transform: `scale(${show ? 1 : 0.94})`}}>
			<MediaView m={m} />
			<div style={{position: 'absolute', top: 18, left: 18, padding: '8px 22px', borderRadius: 999, background: m.color, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 30}}>{m.label}</div>
		</div>
	);
	return (
		<AbsoluteFill>
			{side(p.left, 400, true)}
			{side(p.right, 1050, t >= (p.rightAt ?? 0))}
			<div style={{position: 'absolute', left: 900, top: 470, ...H(80, C.yellow)}}>→</div>
		</AbsoluteFill>
	);
};

const Chart: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	const bars: {label: string; value: number; color?: string}[] = p.bars;
	const max = Math.max(...bars.map((b) => b.value));
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{...H(56), marginBottom: 30}}>{p.title}</div>
			<div style={{display: 'flex', alignItems: 'flex-end', gap: 80, height: 560}}>
				{bars.map((b, i) => {
					const g = sp(f, 6 + i * 8, 16);
					return (
						<div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 240}}>
							<div style={{...H(64, b.color ?? C.white), opacity: g}}>{Math.round(b.value * Math.min(1, g))}{p.suffix ?? ''}</div>
							<div style={{width: 200, height: (b.value / max) * 420 * g, borderRadius: '18px 18px 0 0', background: b.color ?? C.green}} />
							<div style={{...H(34, C.mute), fontWeight: 800, marginTop: 12}}>{b.label}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

const Checklist: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const items: {text: string; at: number}[] = p.items;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: 1300, padding: 54, ...glass}}>
				<div style={{...H(64), marginBottom: 26}}>{p.title}</div>
				{items.map((it, i) => {
					const on = t >= it.at;
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, padding: '16px 0', opacity: t >= it.at - 0.6 ? 1 : 0.35}}>
							<div style={{width: 74, height: 74, borderRadius: 18, border: `5px solid ${on ? C.green : 'rgba(255,255,255,0.4)'}`, background: on ? C.green : 'transparent', color: C.ink, fontSize: 52, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? 1 + 0.2 * Math.max(0, 1 - (t - it.at) * 4) : 1})`}}>{on ? '✓' : i + 1}</div>
							<div style={{...H(48), fontWeight: 800}}>{it.text}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

const PhoneImage: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<div style={{transform: `translateY(${(1 - pop(f)) * 300}px)`}}>
				<Phone x={p.x ?? 1300} scale={0.95}><Img src={staticFile(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></Phone>
			</div>
			<div style={{position: 'absolute', left: 120, top: 360, width: 760}}>
				<div style={H(70)}>{p.title}</div>
				{p.sub ? <div style={{...H(44, C.yellow), fontWeight: 700, marginTop: 20}}>{p.sub}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

const Profile: React.FC<{p: any}> = ({p}) => {
	const t = useLocal();
	const after = t >= (p.flipAt ?? 1.2);
	const prof = after ? p.after : p.before;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: 900, padding: 46, borderRadius: 34, background: '#fff', color: '#111', boxShadow: '0 40px 90px rgba(0,0,0,0.5)', transform: `rotateY(${after ? 0 : 0}deg)`}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 34}}>
					<div style={{width: 170, height: 170, borderRadius: '50%', background: after ? `radial-gradient(circle, ${C.green}, ${C.greenDeep})` : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 90}}>{after ? '🍳' : '👤'}</div>
					<div style={{fontFamily: FONT, fontSize: 30, display: 'flex', gap: 40}}>{['Posts', 'Followers', 'Following'].map((k, i) => <div key={k} style={{textAlign: 'center'}}><b style={{fontSize: 40}}>{prof.stats[i]}</b><br />{k}</div>)}</div>
				</div>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 38, marginTop: 24}}>{prof.name}</div>
				<div style={{fontFamily: FONT, fontSize: 30, marginTop: 8, whiteSpace: 'pre-wrap', color: '#333'}}>{prof.bio}</div>
			</div>
			<div style={{position: 'absolute', top: 70, padding: '12px 34px', borderRadius: 999, background: after ? C.green : '#555', color: after ? C.ink : '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 40}}>{after ? 'AFTER ✨' : 'BEFORE'}</div>
		</AbsoluteFill>
	);
};

const Sawaal: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	const pulse = 1 + Math.sin(f / 5) * 0.04;
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${C.green}33, ${C.ink} 65%)`, alignItems: 'center', justifyContent: 'center', gap: 34}}>
			<div style={{fontSize: 170, transform: `scale(${pop(f) * pulse})`}}>❓</div>
			<div style={{...H(120, C.yellow), transform: `scale(${pop(f, 3)})`}}>SAWAAL TIME</div>
			<div style={{...H(54), opacity: ramp(f, 8, 18)}}>Kapil live aa rahe hain 🎙️</div>
			{p.q ? <div style={{padding: '18px 44px', borderRadius: 999, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 48, opacity: ramp(f, 14, 24)}}>{p.q}</div> : null}
		</AbsoluteFill>
	);
};

const NextClass: React.FC<{p: any}> = ({p}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30}}>
			<div style={{...H(44, C.mute), letterSpacing: 6}}>AGLI CLASS</div>
			<div style={{...H(120), transform: `scale(${pop(f)})`}}>{p.title}</div>
			<div style={{padding: '18px 46px', borderRadius: 999, background: C.yellow, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 56, transform: `scale(${pop(f, 6)})`}}>{p.date}</div>
			<div style={{padding: '22px 60px', borderRadius: 999, background: '#FF0033', color: C.white, fontFamily: FONT, fontWeight: 900, fontSize: 56, transform: `scale(${pop(f, 14) * (1 + Math.sin(f / 5) * 0.03)})`, marginTop: 20}}>🔔 SUBSCRIBE</div>
		</AbsoluteFill>
	);
};

const FullMedia: React.FC<{p: any}> = ({p}) => <AbsoluteFill style={{background: '#000'}}><MediaView m={p} style={{objectFit: p.fit ?? 'contain'}} /></AbsoluteFill>;

const BEATS: Record<string, React.FC<{p: any}>> = {hero: Hero, counter: Counter, ticks: Ticks, credits: Credits, montage: Montage, roadmap: Roadmap, apps: Apps, browser: Browser, card: Card, chat: Chat, split: Split, chart: Chart, checklist: Checklist, phoneImage: PhoneImage, profile: Profile, sawaal: Sawaal, next: NextClass, media: FullMedia};

export const Lesson: React.FC<LessonProps> = ({audio, duration, beats, chunks, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const sorted = [...beats].sort((a, b) => a.t - b.t);
	const cur = chunks.find((c) => t >= c.s && t < c.e + 0.15);
	const inSawaal = sorted.some((b) => b.type === 'sawaal' && t >= b.t && t < (b.end ?? duration));
	return (
		<AbsoluteFill style={{background: C.ink}}>
			<BrandBg />
			{sorted.map((b, i) => {
				const end = b.end ?? sorted[i + 1]?.t ?? duration;
				const Comp = BEATS[b.type];
				if (!Comp) return null;
				const from = Math.round(b.t * FPS), len = Math.max(1, Math.round((end - b.t) * FPS));
				return (
					<Sequence key={i} from={from} durationInFrames={len}>
						<AbsoluteFill style={{opacity: Math.min(1, (f - from) / 6) * Math.min(1, (from + len - f) / 5)}}>
							<Comp p={{...b.p, dur: end - b.t}} />
						</AbsoluteFill>
					</Sequence>
				);
			})}
			{captions && cur && !inSawaal ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 36}}>
					<CaptionLine key={cur.s} chunk={cur} t={t} size={46} />
				</AbsoluteFill>
			) : null}
			{audio ? <Audio src={staticFile(audio)} /> : null}
		</AbsoluteFill>
	);
};
