import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadBaloo} from '@remotion/google-fonts/Baloo2';
import {interpolate, spring, Easing} from 'remotion';
import B_ from './brand.json';

/** Edit src/brand.json to make the look yours (name, handle, colours, photos). */
export const BRAND = B_;

const M = loadMontserrat('normal', {weights: ['500', '700', '800', '900'], subsets: ['latin']}).fontFamily;
const B = loadBaloo('normal', {weights: ['500', '700', '800'], subsets: ['latin', 'devanagari']}).fontFamily;

// Montserrat for Latin, Baloo 2 picks up Devanagari glyphs.
export const FONT = `${M}, ${B}, sans-serif`;

export const C = {
	green: B_.colors.accent,
	greenDeep: '#00A86B',
	yellow: B_.colors.accent2,
	ink: B_.colors.ink,
	ink2: '#0E1F18',
	white: '#FFFFFF',
	mute: 'rgba(255,255,255,0.72)',
	glass: 'rgba(14,31,24,0.62)',
	glassLine: 'rgba(255,255,255,0.16)',
	red: '#FF4D5E',
};

export const FPS = 30;

/** spring that starts at `delay` frames */
export const sp = (frame: number, delay = 0, damping = 14, mass = 0.7) =>
	spring({frame: frame - delay, fps: FPS, config: {damping, mass, stiffness: 140}});

/** 0→1 between frames a and b, eased */
export const ramp = (frame: number, a: number, b: number, ease = Easing.bezier(0.22, 1, 0.36, 1)) =>
	interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const glassPanel: React.CSSProperties = {
	background: C.glass,
	border: `2px solid ${C.glassLine}`,
	backdropFilter: 'blur(18px)',
	WebkitBackdropFilter: 'blur(18px)',
	boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
};
