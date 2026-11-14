// 16:9 -> 9:16 (or any) reframe that follows the face. Audio comes from the source.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type ReframeProps = {src: string; srcW: number; srcH: number; faces: ([number, number, number] | null)[]; duration: number; width: number; height: number; zoom?: number};

export const Reframe: React.FC<ReframeProps> = ({src, srcW, srcH, faces, zoom = 1}) => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const scale = Math.max(width / srcW, height / srcH) * zoom; // cover
	const vw = srcW * scale, vh = srcH * scale;
	const face = faces[Math.min(faces.length - 1, f)];
	const cx = face ? face[0] * scale : vw / 2;
	const cy = face ? face[1] * scale : vh / 2;
	const x = Math.min(0, Math.max(width - vw, width / 2 - cx));
	const y = Math.min(0, Math.max(height - vh, height * 0.38 - cy)); // eyes a bit above centre
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<OffthreadVideo src={staticFile(src)} style={{position: 'absolute', left: x, top: y, width: vw, height: vh}} />
		</AbsoluteFill>
	);
};
