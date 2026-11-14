import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './brand';
import {IntroSting, TitleCard, ChapterCard, StepBadge, WinBurst, PhoneToLaptop, LowerThird, EndCard} from './look';
import {Captions, CaptionProps, StepClip, StepClipProps, INTRO} from './clips';

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
			defaultProps={{name: 'Kapil', role: 'AI Wala Kapil · @aiwalakapil'}} />
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
	</>
);
