import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, FPS, sp, ramp} from './brand';
import {ChapterCard, StepBadge} from './look';

// ---------- word-highlight captions ----------
export type Word = {w: string; s: number; e: number};
export type Chunk = {s: number; e: number; text: string; words: Word[]};
export type CaptionProps = {src: string; chunks: Chunk[]; duration: number; width: number; height: number; position: 'center' | 'bottom'; size?: number};

export const CaptionLine: React.FC<{chunk: Chunk; t: number; size: number}> = ({chunk, t, size}) => {
	const f = useCurrentFrame();
	const startF = Math.round(chunk.s * FPS);
	const p = sp(f, startF, 12, 0.5);
	return (
		<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.3, rowGap: 6, transform: `scale(${0.85 + p * 0.15})`, opacity: Math.min(1, p * 1.5), maxWidth: '86%'}}>
			{chunk.words.map((w, i) => {
				const on = t >= w.s && t < (chunk.words[i + 1]?.s ?? chunk.e + 0.05);
				const said = t >= w.s;
				return (
					<span key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.15, color: on ? C.ink : said ? C.white : 'rgba(255,255,255,0.85)', background: on ? C.green : 'transparent', borderRadius: size * 0.18, padding: `0 ${size * 0.14}px`, WebkitTextStroke: on ? '0px' : `${size * 0.09}px ${C.ink}`, paintOrder: 'stroke', textShadow: on ? 'none' : `0 ${size * 0.06}px 0 ${C.ink}`, transform: on ? 'scale(1.08)' : 'scale(1)', display: 'inline-block'}}>
						{w.w}
					</span>
				);
			})}
		</div>
	);
};

export const Captions: React.FC<CaptionProps> = ({src, chunks, position, size}) => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const t = f / FPS;
	const cur = chunks.find((c) => t >= c.s && t < c.e + 0.15);
	const fs = size ?? Math.round(width * (height > width ? 0.075 : 0.045));
	return (
		<AbsoluteFill>
			{src ? <OffthreadVideo src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: position === 'center' ? 'center' : 'flex-end', paddingBottom: position === 'bottom' ? height * 0.16 : 0, paddingTop: position === 'center' ? height * 0.18 : 0}}>
				{cur ? <CaptionLine key={cur.s} chunk={cur} t={t} size={fs} /> : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- step clip: chapter sting + clip + badge + "ban gaya" tail ----------
export type StepClipProps = {src: string; start: number; end: number; step: number; total: number; title: string; done: string};
export const INTRO = 45; // 1.5 s chapter card
export const TAIL = 75; // 2.5 s done card overlay at the end of the clip

const DoneCard: React.FC<{text: string}> = ({text}) => {
	const f = useCurrentFrame();
	const p = sp(f, 0, 10);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 120, background: `linear-gradient(transparent 55%, rgba(6,17,13,${0.75 * ramp(f, 0, 10)}))`}}>
			<div style={{transform: `translateY(${(1 - p) * 160}px)`, display: 'flex', alignItems: 'center', gap: 22, padding: '22px 46px', borderRadius: 999, background: C.green, color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 56, boxShadow: `0 0 60px ${C.green}aa`}}>
				✅ {text}
			</div>
		</AbsoluteFill>
	);
};

export const StepClip: React.FC<StepClipProps> = ({src, start, end, step, total, title, done}) => {
	const clipF = Math.max(1, Math.round((end - start) * FPS));
	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Sequence from={INTRO} durationInFrames={clipF}>
				<OffthreadVideo src={staticFile(src)} startFrom={Math.round(start * FPS)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
				<StepBadge step={step} total={total} title={title} />
			</Sequence>
			<Sequence from={0} durationInFrames={INTRO + 8}>
				<ChapterCard step={step} total={total} title={title} />
			</Sequence>
			<Sequence from={INTRO + Math.max(0, clipF - TAIL)} durationInFrames={Math.min(TAIL, clipF)}>
				<DoneCard text={done} />
			</Sequence>
		</AbsoluteFill>
	);
};
