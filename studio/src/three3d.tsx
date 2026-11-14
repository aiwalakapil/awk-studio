// 3D intros (three.js via @remotion/three): metal letters that fly in, a glowing ring, particles,
// and a spinning gold coin. All text and colours are props, and they frame themselves for 16:9 or 9:16.
import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import fontJson from 'three/examples/fonts/helvetiker_bold.typeface.json';
import {BRAND, C, FONT} from './brand';

const TFONT = new FontLoader().parse(fontJson as never);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const letterGeometries = (text: string, size: number, depth: number) => {
	let x = 0;
	const out: {g: THREE.BufferGeometry; x: number}[] = [];
	for (const ch of text) {
		if (ch === ' ') { x += size * 0.45; continue; }
		const g = new TextGeometry(ch, {font: TFONT, size, depth, curveSegments: 10, bevelEnabled: true, bevelThickness: size * 0.06, bevelSize: size * 0.035, bevelSegments: 5});
		g.computeBoundingBox();
		const w = g.boundingBox!.max.x - g.boundingBox!.min.x;
		out.push({g, x});
		x += w + size * 0.12;
	}
	return {letters: out, width: x - size * 0.12};
};

// reflections without downloading an HDR: three's built-in studio room
const StudioEnv: React.FC = () => {
	const {gl, scene} = useThree();
	useMemo(() => {
		const pm = new THREE.PMREMGenerator(gl);
		scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
	}, [gl, scene]);
	return null;
};

const Camera: React.FC<{z: number; x?: number; y?: number; lookY?: number}> = ({z, x = 0, y = 0, lookY = 0}) => {
	const {camera} = useThree();
	camera.position.set(x, y, z);
	camera.lookAt(0, lookY, 0);
	return null;
};

const FlyText: React.FC<{text: string; size: number; y: number; at: number; color: string; metal?: number; stagger?: number}> = ({text, size, y, at, color, metal = 0.85, stagger = 3}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	// helvetiker has Latin glyphs only; keep 3D text ASCII (put Hindi in the 2D subtitle)
	const safe = text.toUpperCase().replace(/[^A-Z0-9 .,!?&@#%+\-$]/g, '');
	const {letters, width} = useMemo(() => letterGeometries(safe, size, size * 0.35), [safe, size]);
	return (
		<group position={[-width / 2, y, 0]}>
			{letters.map((l, i) => {
				const p = spring({frame: frame - at - i * stagger, fps, config: {damping: 13, mass: 0.8}});
				return (
					<mesh key={i} geometry={l.g} position={[l.x, (1 - p) * -size * 1.5, (1 - p) * -40]} rotation={[(1 - p) * 1.8, (1 - p) * -1.2, 0]} scale={Math.max(0.001, p)}>
						<meshStandardMaterial color={color} metalness={metal} roughness={0.22} envMapIntensity={1.2} />
					</mesh>
				);
			})}
		</group>
	);
};

const Particles: React.FC<{color: string}> = ({color}) => {
	const frame = useCurrentFrame();
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		const pos = new Float32Array(500 * 3);
		let seed = 7;
		const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
		for (let i = 0; i < 500; i++) {
			pos[i * 3] = (rnd() - 0.5) * 60; pos[i * 3 + 1] = (rnd() - 0.5) * 60; pos[i * 3 + 2] = -rnd() * 48;
		}
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		return g;
	}, []);
	return (
		<points geometry={geo} rotation={[0, frame * 0.002, 0]} position={[0, 0, frame * 0.02]}>
			<pointsMaterial color={color} size={0.12} transparent opacity={0.8} />
		</points>
	);
};

const Sweep: React.FC<{at: number; dur: number}> = ({at, dur}) => {
	const frame = useCurrentFrame();
	const x = interpolate(frame, [at, at + dur], [-22, 22], clamp);
	return <pointLight position={[x, 3, 6]} intensity={interpolate(frame, [at, at + 6, at + dur - 6, at + dur], [0, 260, 260, 0], clamp)} distance={30} color="#ffffff" />;
};

const Sfx: React.FC<{cues: [number, string, number][]}> = ({cues}) => (
	<>{cues.map(([at, name, v], i) => <Sequence key={i} from={at} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={v} /></Sequence>)}</>
);

// vertical frames see less width: pull the camera back so the words still fit
const useFit = (longest = 6) => {
	const {width, height} = useVideoConfig();
	const v = height > width ? (height / width) * 1.2 : 1;
	return v * Math.max(1, longest / 7);   // long first lines need a bit more room
};

export type Logo3DProps = {line1: string; line2?: string; sub?: string; color1?: string; color2?: string; glow?: string; sfx?: boolean};
export const LOGO3D_LEN = 180;

export const Logo3D: React.FC<Logo3DProps> = ({line1, line2 = '', sub = '', color1 = C.green, color2 = '#e9edf7', glow = C.green, sfx = true}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const k = useFit(line1.length * 1.1);
	const camZ = interpolate(frame, [0, 120], [42, 23], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}) * k;
	const camX = interpolate(frame, [0, 120, 180], [-7, 0, 1.2], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
	const ring = spring({frame: frame - 40, fps: 30, config: {damping: 18}});
	const subO = interpolate(frame, [95, 115], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${C.ink2} 0%, ${C.ink} 70%)`}}>
			<ThreeCanvas width={width} height={height} camera={{fov: 35, position: [0, 0, 34]}}>
				<StudioEnv />
				<Camera z={camZ} x={camX} y={1.2} lookY={0.4} />
				<ambientLight intensity={0.25} />
				<directionalLight position={[5, 8, 10]} intensity={1.6} />
				<pointLight position={[-8, -2, -6]} intensity={120} color={glow} distance={40} />
				<Sweep at={70} dur={45} />
				<FlyText text={line1} size={2.6} y={line2 ? 1.0 : 0} at={8} color={color1} />
				{line2 ? <FlyText text={line2} size={1.45} y={-2.1} at={34} color={color2} metal={0.9} stagger={2} /> : null}
				<mesh position={[0, 0, -3]} rotation={[0, 0, frame * 0.01]} scale={ring}>
					<torusGeometry args={[7.2, 0.06, 16, 160]} />
					<meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.4} />
				</mesh>
				<Particles color={C.yellow} />
			</ThreeCanvas>
			{sub ? <div style={{position: 'absolute', left: 0, right: 0, bottom: height * 0.14, textAlign: 'center', opacity: subO, transform: `translateY(${(1 - subO) * 20}px)`, fontFamily: FONT, fontWeight: 800, letterSpacing: width * 0.009, fontSize: width * (height > width ? 0.04 : 0.018), color: C.mute}}>{sub}</div> : null}
			{sfx ? <Sfx cues={[[0, 'riser', 0.35], [8, 'whoosh', 0.45], [34, 'whoosh2', 0.45], [58, 'hit', 0.55], [72, 'ding', 0.3]]} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- gold coin intro
const GOLD = '#f2c14e';
const rupeeTubes = () => {
	const v = (x: number, y: number) => new THREE.Vector3(x, y, 0);
	const bowl = new THREE.CurvePath<THREE.Vector3>();
	bowl.add(new THREE.LineCurve3(v(-1.3, 1.6), v(-0.2, 1.6)));
	bowl.add(new THREE.CubicBezierCurve3(v(-0.2, 1.6), v(1.4, 1.6), v(1.4, 0.0), v(-0.2, 0.0)));
	bowl.add(new THREE.LineCurve3(v(-0.2, 0.0), v(-1.25, 0.0)));
	const parts = [new THREE.LineCurve3(v(-1.3, 1.6), v(1.3, 1.6)), new THREE.LineCurve3(v(-1.3, 0.85), v(1.3, 0.85)), bowl, new THREE.LineCurve3(v(-1.25, 0.0), v(1.0, -1.9))];
	return parts.map((c) => new THREE.TubeGeometry(c as THREE.Curve<THREE.Vector3>, 64, 0.2, 16, false));
};

const Coin: React.FC<{spin: number; y: number; scale: number; symbol: string}> = ({spin, y, scale, symbol}) => {
	const tubes = useMemo(rupeeTubes, []);
	const glyph = useMemo(() => (symbol === '₹' ? null : letterGeometries(symbol.slice(0, 1), 3.2, 0.5)), [symbol]);
	return (
		<group position={[0, y, 0]} rotation={[0, spin, 0]} scale={scale}>
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[3.4, 3.4, 0.55, 96]} />
				<meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
			</mesh>
			<mesh><torusGeometry args={[3.4, 0.22, 24, 120]} /><meshStandardMaterial color="#e0a92e" metalness={1} roughness={0.2} /></mesh>
			<mesh position={[0, 0, 0.3]}><torusGeometry args={[2.85, 0.07, 12, 120]} /><meshStandardMaterial color="#c98e1a" metalness={1} roughness={0.3} /></mesh>
			{[0.33, -0.33].map((z, k) => (
				<group key={k} position={[0.05, 0.05, z]} rotation={[0, k ? Math.PI : 0, 0]}>
					{glyph
						? glyph.letters.map((l, i) => <mesh key={i} geometry={l.g} position={[-glyph.width / 2, -1.6, -0.25]}><meshStandardMaterial color="#fff1c2" metalness={1} roughness={0.18} /></mesh>)
						: tubes.map((g, i) => <mesh key={i} geometry={g}><meshStandardMaterial color="#fff1c2" metalness={1} roughness={0.18} /></mesh>)}
				</group>
			))}
		</group>
	);
};

const Rain: React.FC = () => {
	const frame = useCurrentFrame();
	const items = useMemo(() => Array.from({length: 26}, (_, i) => ({x: ((i * 37) % 26) - 13, z: -6 - ((i * 13) % 12), d: (i * 7) % 60, s: 0.25 + ((i * 11) % 10) / 30})), []);
	return (
		<>
			{items.map((c, i) => {
				const t = frame - 40 - c.d;
				if (t < 0) return null;
				return (
					<mesh key={i} position={[c.x, 12 - t * 0.18, c.z]} rotation={[t * 0.1, t * 0.07, 0]} scale={c.s}>
						<cylinderGeometry args={[1, 1, 0.18, 32]} />
						<meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
					</mesh>
				);
			})}
		</>
	);
};

export type Coin3DProps = {line1: string; line2?: string; symbol?: string; sfx?: boolean};
export const COIN3D_LEN = 180;

export const Coin3D: React.FC<Coin3DProps> = ({line1, line2 = '', symbol = '₹', sfx = true}) => {
	const frame = useCurrentFrame();
	const {width, height, fps} = useVideoConfig();
	const k = useFit(Math.max(line1.length, (line2 || '').length * 0.6));
	const drop = spring({frame: frame - 4, fps, config: {damping: 9, mass: 1.1}});
	const y = interpolate(drop, [0, 1], [14, 1.6]);
	const spin = interpolate(frame, [0, 60, 110], [Math.PI * 6, Math.PI * 0.15, 0], {...clamp, easing: Easing.out(Easing.cubic)}) + Math.sin(frame / 30) * 0.12;
	const shrink = interpolate(frame, [70, 100], [1, 0.62], {...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1)});
	const coinY = y + interpolate(frame, [70, 100], [0, 1.4], clamp);
	const camZ = interpolate(frame, [0, 170], [24, 20.5], clamp) * k;
	const glint = interpolate(frame, [55, 80], [-12, 12], clamp);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 60% at 50% 40%, #3a2a0a 0%, #0b0905 70%)'}}>
			<ThreeCanvas width={width} height={height} camera={{fov: 35, position: [0, 0, 24]}}>
				<StudioEnv />
				<Camera z={camZ} y={0.4} lookY={0.2} />
				<ambientLight intensity={0.3} />
				<directionalLight position={[6, 8, 10]} intensity={1.8} />
				<pointLight position={[glint, 4, 7]} intensity={frame > 50 && frame < 85 ? 300 : 0} distance={30} />
				<pointLight position={[0, -6, -4]} intensity={80} color="#ff9b3d" distance={30} />
				<Coin spin={spin} y={coinY} scale={shrink} symbol={symbol} />
				<FlyText text={line1} size={1.7} y={-3.4} at={88} color={GOLD} />
				{line2 ? <FlyText text={line2} size={0.95} y={-5.3} at={104} color="#f4f1ea" metal={0.9} stagger={2} /> : null}
				<Rain />
			</ThreeCanvas>
			{sfx ? <Sfx cues={[[2, 'whoosh', 0.45], [16, 'ding', 0.45], [58, 'ding', 0.3], [88, 'hit', 0.5], [104, 'whoosh2', 0.4], [118, 'success', 0.35]]} /> : null}
		</AbsoluteFill>
	);
};

export const defaultLogo: Logo3DProps = {line1: BRAND.title[0] ?? 'AI WALA', line2: BRAND.title[1] ?? 'KAPIL', sub: BRAND.tagline};
