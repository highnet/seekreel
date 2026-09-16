import { writeFile } from "node:fs/promises";

/**
 * Write 16-bit stereo PCM to a WAV file.
 *
 * 16-bit because the encoder's next stop is AAC or Opus and neither gains
 * anything from more; the fade and the peak normalisation happen here, on
 * floats, before the quantisation that would make them audible.
 */
export interface WavOptions {
  sampleRate: number;
  fadeIn?: number;
  fadeOut?: number;
  /** Normalisation target, 0 to 1, or null to leave the level alone. */
  peak?: number | null;
}

export async function writeWav(
  file: string,
  interleaved: Float32Array,
  { sampleRate, fadeIn = 0, fadeOut = 0, peak = null }: WavOptions,
): Promise<{ frames: number; seconds: number }> {
  const frames = Math.floor(interleaved.length / 2);

  if (peak != null) {
    let loudest = 0;
    for (let i = 0; i < interleaved.length; i++) loudest = Math.max(loudest, Math.abs(interleaved[i]));
    if (loudest > 0) {
      const gain = peak / loudest;
      for (let i = 0; i < interleaved.length; i++) interleaved[i] *= gain;
    }
  }

  const fadeInFrames = Math.round(fadeIn * sampleRate);
  const fadeOutFrames = Math.round(fadeOut * sampleRate);
  for (let frame = 0; frame < frames; frame++) {
    let gain = 1;
    if (fadeInFrames > 0 && frame < fadeInFrames) gain *= frame / fadeInFrames;
    const fromEnd = frames - 1 - frame;
    if (fadeOutFrames > 0 && fromEnd < fadeOutFrames) gain *= fromEnd / fadeOutFrames;
    if (gain !== 1) {
      interleaved[frame * 2] *= gain;
      interleaved[frame * 2 + 1] *= gain;
    }
  }

  const data = Buffer.alloc(frames * 4);
  for (let i = 0; i < frames * 2; i++) {
    /* Clamp before scaling: a sample at exactly 1.0 would wrap to -32768. */
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    data.writeInt16LE(Math.round(sample * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);          // PCM header length
  header.writeUInt16LE(1, 20);           // format: uncompressed PCM
  header.writeUInt16LE(2, 22);           // channels
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 4, 28); // byte rate: 2ch x 2 bytes
  header.writeUInt16LE(4, 32);           // block align
  header.writeUInt16LE(16, 34);          // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  await writeFile(file, Buffer.concat([header, data]));
  return { frames, seconds: frames / sampleRate };
}
