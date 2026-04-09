// src/utils/soundUtils.js

let globalAudioCtx = null;

const getAudioContext = () => {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return null;
    if (!globalAudioCtx) globalAudioCtx = new A();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume().catch(() => {});
    return globalAudioCtx;
};

export const playSound = (type) => {
    try {
        const ctx = getAudioContext(); 
        if (!ctx) return;
        
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime;
        
        if (type === 'pop')     { o.type='sine'; o.frequency.setValueAtTime(400,t); o.frequency.exponentialRampToValueAtTime(600,t+.05); g.gain.setValueAtTime(.2,t); g.gain.exponentialRampToValueAtTime(.01,t+.05); o.start(t); o.stop(t+.05); }
        if (type === 'success') { o.type='sine'; o.frequency.setValueAtTime(600,t); o.frequency.setValueAtTime(800,t+.1); g.gain.setValueAtTime(.15,t); g.gain.setValueAtTime(.15,t+.1); g.gain.exponentialRampToValueAtTime(.01,t+.3); o.start(t); o.stop(t+.3); }
        if (type === 'delete')  { o.type='triangle'; o.frequency.setValueAtTime(200,t); o.frequency.exponentialRampToValueAtTime(50,t+.15); g.gain.setValueAtTime(.2,t); g.gain.exponentialRampToValueAtTime(.01,t+.15); o.start(t); o.stop(t+.15); }
        if (type === 'switch')  { o.type='square'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(150,t+.05); g.gain.setValueAtTime(.05,t); g.gain.exponentialRampToValueAtTime(.01,t+.05); o.start(t); o.stop(t+.05); }
    } catch (_) { /* ignore */ }
};