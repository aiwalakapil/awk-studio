import React from 'react';
import {Composition} from 'remotion';
import {BRAND, FPS} from './brand';
import {IntroSting, TitleCard, ChapterCard, StepBadge, WinBurst, PhoneToLaptop, LowerThird, EndCard} from './look';
import {Captions, CaptionProps, StepClip, StepClipProps, INTRO} from './clips';
import {FxLayer, FxLayerProps} from './fx';
import {Reframe, ReframeProps} from './reframe';
import {Carousel, CarouselProps, SLIDE_F} from './carousel';
import {Whiteboard, WhiteboardProps} from './whiteboard';
import {Lesson, LessonProps} from './lesson';
import {Logo3D, Logo3DProps, LOGO3D_LEN, Coin3D, Coin3DProps, COIN3D_LEN, defaultLogo} from './three3d';

const W = 1920, H = 1080;

export const Root: React.FC = () => (
	<>
		{/* ---- course-look pack ---- */}
		<Composition id="IntroSting" component={IntroSting} durationInFrames={90} fps={FPS} width={W} height={H} />
		<Composition id="TitleCard" component={TitleCard} durationInFrames={150} fps={FPS} width={W} height={H}
			defaultProps={{lecture: 4, title: 'Editing + Cover', result: 'Pehli reel POST 🎉', part: 'BOOTCAMP'}} />
		<Composition id="ChapterCard" component={ChapterCard} durationInFrames={75} fps={FPS} width={W} height={H}
			defaultProps={{step: 2, total: 6, title: 'Auto captions'}} />
		<Composition id="StepBadge" component={StepBadge} durationInFrames={60} fps={FPS} width={W} height={H}
			defaultProps={{step: 2, total: 6, title: 'Auto captions'}} />
		<Composition id="WinBurst" component={WinBurst} durationInFrames={90} fps={FPS} width={W} height={H}
			defaultProps={{text: 'PROUD MOMENT!', sub: 'Tumne bana liya ✅'}} />
		<Composition id="PhoneToLaptop" component={PhoneToLaptop} durationInFrames={90} fps={FPS} width={W} height={H} />
		<Composition id="LowerThird" component={LowerThird} durationInFrames={150} fps={FPS} width={W} height={H}
			defaultProps={{name: BRAND.name, role: BRAND.role}} />
		<Composition id="EndCard" component={EndCard} durationInFrames={180} fps={FPS} width={W} height={H}
			defaultProps={{next: 'Growth System'}} />

		{/* ---- captions (size + length come from props) ---- */}
		<Composition id="Captions" component={Captions} fps={FPS} width={1080} height={1920} durationInFrames={300}
			defaultProps={{src: '', chunks: [], duration: 10, width: 1080, height: 1920, position: 'center'} as CaptionProps}
			calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.duration * FPS)), width: props.width, height: props.height})} />

		{/* ---- step clips ---- */}
		<Composition id="StepClip" component={StepClip} fps={FPS} width={W} height={H} durationInFrames={300}
			defaultProps={{src: '', start: 0, end: 10, step: 1, total: 1, title: 'Step', done: 'Ye ban gaya'} as StepClipProps}
			calculateMetadata={({props}) => ({durationInFrames: INTRO + Math.max(1, Math.round((props.end - props.start) * FPS))})} />

		{/* ---- effects layers (transparent, composited by effects.py) ---- */}
		<Composition id="FxLayer" component={FxLayer} fps={FPS} width={1080} height={1920} durationInFrames={300}
			defaultProps={{layer: 'front', cues: [], faces: [], duration: 10, width: 1080, height: 1920, src: ''} as FxLayerProps}
			calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.duration * FPS)), width: props.width, height: props.height})} />
		<Composition id="Reframe" component={Reframe} fps={FPS} width={1080} height={1920} durationInFrames={300}
			defaultProps={{src: '', srcW: 1920, srcH: 1080, faces: [], duration: 10, width: 1080, height: 1920} as ReframeProps}
			calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.duration * FPS)), width: props.width, height: props.height})} />
		<Composition id="Carousel" component={Carousel} fps={FPS} width={1080} height={1350} durationInFrames={300}
			defaultProps={{slides: [{type: 'hook', title: 'Ek prompt, 7 slides', chip: 'DAY 9'}, {type: 'cta', title: 'Save karo'}], series: 'AI WALA KAPIL'} as CarouselProps}
			calculateMetadata={({props}) => ({durationInFrames: props.slides.length * SLIDE_F + 60})} />
		{/* ---- 3D intros (props: text, colours; size from --width/--height) ---- */}
		<Composition id="Logo3D" component={Logo3D} durationInFrames={LOGO3D_LEN} fps={FPS} width={W} height={H} defaultProps={defaultLogo as Logo3DProps} />
		<Composition id="Logo3DVertical" component={Logo3D} durationInFrames={LOGO3D_LEN} fps={FPS} width={1080} height={1920} defaultProps={defaultLogo as Logo3DProps} />
		<Composition id="Coin3D" component={Coin3D} durationInFrames={COIN3D_LEN} fps={FPS} width={W} height={H} defaultProps={{line1: 'FINANCE', line2: 'WITH HIMANSH'} as Coin3DProps} />
		<Composition id="Coin3DVertical" component={Coin3D} durationInFrames={COIN3D_LEN} fps={FPS} width={1080} height={1920} defaultProps={{line1: 'FINANCE', line2: 'WITH HIMANSH'} as Coin3DProps} />
		<Composition id="Whiteboard" component={Whiteboard} fps={FPS} width={W} height={H} durationInFrames={300}
			defaultProps={{items: [], duration: 10, width: W, height: H} as WhiteboardProps}
			calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.duration * FPS)), width: props.width, height: props.height})} />
		<Composition id="Lesson" component={Lesson} fps={FPS} width={W} height={H} durationInFrames={300}
			defaultProps={{duration: 10, beats: [], chunks: []} as LessonProps}
			calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.duration * FPS))})} />
	</>
);
