export const maxxStoryConfig = {
  intro: {
    durationMs: 4000,
    countdownFrames: 4,
    skipKey: 'Escape',
    seenKey: 'maxx_intro_seen',
  },
  hero: {
    parallaxScrub: true,
    textDriftY: '50%',
  },
  briefing: {
    slideInDuration: 1.5,
    scrubAmount: 1,
    startOffset: '60%',
  },
  carIntro: {
    revealDuration: 1.8,
    pinLength: '+=150%',
    scrubAmount: 1.2,
    overlayOpacityStart: 0.9,
    overlayOpacityEnd: 0.15,
  },
  mustang: {
    pinLength: '+=300%',
    scrubAmount: 1,
    scaleTarget: 1.1,
    driftX: '-5%',
  },
} as const;
