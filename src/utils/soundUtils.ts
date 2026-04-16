// src/utils/soundUtils.ts

// ประกาศตัวแปรเก็บ AudioContext แบบ Singleton
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    // ป้องกัน Error กรณีรันบน Server-Side Rendering (เช่น Next.js/Gatsby)
    if (typeof window === 'undefined') return null;

    // รองรับ Safari (webkitAudioContext) และเบราว์เซอร์อื่นๆ
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!globalAudioCtx) {
        globalAudioCtx = new AudioContextClass();
    }

    // เบราว์เซอร์มักจะระงับ (Suspend) เสียงจนกว่าผู้ใช้จะคลิกโต้ตอบกับเว็บ
    // เราจึงต้องสั่ง resume() เมื่อมีการเรียกใช้
    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().catch(() => {});
    }

    return globalAudioCtx;
};

// กำหนด Type ของเสียงที่มีในระบบ
export type SoundType = 'pop' | 'success' | 'delete' | 'switch';

export const playSound = (type: SoundType): void => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.connect(g);
        g.connect(ctx.destination);

        const t = ctx.currentTime;

        switch (type) {
            case 'pop':
                o.type = 'sine';
                o.frequency.setValueAtTime(400, t);
                o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
                g.gain.setValueAtTime(0.2, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t);
                o.stop(t + 0.05);
                break;

            case 'success':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.setValueAtTime(800, t + 0.1);
                g.gain.setValueAtTime(0.15, t);
                g.gain.setValueAtTime(0.15, t + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t);
                o.stop(t + 0.3);
                break;

            case 'delete':
                o.type = 'triangle';
                o.frequency.setValueAtTime(200, t);
                o.frequency.exponentialRampToValueAtTime(50, t + 0.15);
                g.gain.setValueAtTime(0.2, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t);
                o.stop(t + 0.15);
                break;

            case 'switch':
                o.type = 'square';
                o.frequency.setValueAtTime(300, t);
                o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
                g.gain.setValueAtTime(0.05, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t);
                o.stop(t + 0.05);
                break;
        }
    } catch (error) {
        // เปลี่ยนจากการปล่อยผ่านเงียบๆ เป็นแสดง Warning ใน Console ตอน Development
        console.warn('Audio playback failed:', error);
    }
};