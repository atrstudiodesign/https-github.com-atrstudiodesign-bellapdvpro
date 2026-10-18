// Local Node / Electron entrypoint delegates to the same backend as Vercel.
// Keeping a single implementation avoids diverging Google AI Studio settings.
export { app } from './api/index';
export { default } from './api/index';
