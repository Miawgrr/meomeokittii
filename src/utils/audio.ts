/**
 * Web Audio API based synthesizers for cute dynamic sound effects
 * This avoids external asset loading issues and plays instantly!
 */

export const playMeowSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Create nodes
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Triangle wave for cute main body
    osc1.type = "triangle";
    // Sawtooth with low gain for reedy "cat vocal" harmonic texture
    osc2.type = "sawtooth";
    
    // Pitch bending (me-o-w)
    // Starting frequency of 390Hz, rises to 790Hz, decays to 540Hz
    osc1.frequency.setValueAtTime(390, now);
    osc1.frequency.exponentialRampToValueAtTime(790, now + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(540, now + 0.35);
    
    osc2.frequency.setValueAtTime(390, now);
    osc2.frequency.exponentialRampToValueAtTime(790, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(540, now + 0.35);
    
    // Bandpass filter to model the mouth/formant transition
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(1900, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(1300, now + 0.35);
    filter.Q.setValueAtTime(1.8, now);
    
    // Volume envelope (Attack, Decay, Sustain, Release)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.08); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.14, now + 0.22); // Sustain-ish
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.42); // Release
    
    // Oscillator mixers
    const osc1Gain = ctx.createGain();
    const osc2Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.85, now);
    osc2Gain.gain.setValueAtTime(0.15, now);
    
    // Route signals
    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    
    osc1Gain.connect(filter);
    osc2Gain.connect(filter);
    
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start play
    osc1.start(now);
    osc2.start(now);
    
    // Stop play
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (error) {
    console.warn("Web Audio API meow play failed:", error);
  }
};

export const playCoinSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // High pitched sine wave for a metallic "clink"
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (error) {}
};

export const playWinSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Simple 3-note arpeggio (C5 - E5 - G5 - C6)
    const playNote = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.55);
    };
    
    playNote(523.25, now);
    playNote(659.25, now + 0.1);
    playNote(783.99, now + 0.2);
    playNote(1046.50, now + 0.3);
  } catch (error) {}
};

export const playSlapSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "sine";
    clickOsc.frequency.setValueAtTime(750, now);
    clickOsc.frequency.exponentialRampToValueAtTime(90, now + 0.035);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.42, now + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    
    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.linearRampToValueAtTime(0.28, now + 0.004);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    
    osc.connect(gainNode);
    clickOsc.connect(clickGain);
    
    gainNode.connect(ctx.destination);
    clickGain.connect(ctx.destination);
    
    osc.start(now);
    clickOsc.start(now);
    
    osc.stop(now + 0.18);
    clickOsc.stop(now + 0.045);
  } catch (error) {
    console.warn("Slap sound failed:", error);
  }
};

export const playAidaSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const playChirp = (startFreq: number, endFreq: number, startTime: number, duration: number, gainVal: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.type = "triangle";
      osc2.type = "sawtooth";
      
      osc1.frequency.setValueAtTime(startFreq, startTime);
      osc1.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
      
      osc2.frequency.setValueAtTime(startFreq, startTime);
      osc2.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
      
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1100, startTime);
      filter.frequency.exponentialRampToValueAtTime(1750, startTime + duration);
      filter.Q.value = 2;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gainVal, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      const osc1Gain = ctx.createGain();
      const osc2Gain = ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.8, startTime);
      osc2Gain.gain.setValueAtTime(0.2, startTime);
      
      osc1.connect(osc1Gain);
      osc2.connect(osc2Gain);
      osc1Gain.connect(filter);
      osc2Gain.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.04);
      osc2.stop(startTime + duration + 0.04);
    };
    
    // "Ai" chirp (pitch sweeping up quickly to express shock/protest)
    playChirp(460, 880, now, 0.11, 0.24);
    
    // "da" chirp (pitch drops slightly, softer ending)
    playChirp(690, 490, now + 0.13, 0.15, 0.2);
  } catch (error) {
    console.warn("Aida sound failed:", error);
  }
};
