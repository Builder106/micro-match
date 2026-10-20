// Engine: the quilt's camera, the panel that blocks unfold into, smooth scrolling inside
// reading panels, the idle input and the Glaxnimate helpers. No DOM access at import time.
export { createCamera, type Camera } from './camera';
export { unfold, fold, contentOut, contentIn } from './panel';
export { smoothPanel, stopSmoothPanel, resetPanelScroll } from './scroll';
export { idle, startIdle } from './idle';
export { ease, isTouch, isMobile, prefersStill } from './env';
