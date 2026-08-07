class QuarticPcmInput extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunks = [];
    this.offset = 0;
    this.queuedSamples = 0;
    this.port.onmessage = (event) => {
      if (event.data?.reset) {
        this.chunks.length = 0;
        this.offset = 0;
        this.queuedSamples = 0;
        return;
      }
      const samples = event.data instanceof Float32Array ? event.data : new Float32Array(event.data);
      if (!samples.length) return;
      this.chunks.push(samples);
      this.queuedSamples += samples.length;
      // Keep latency bounded if the renderer was briefly suspended.
      while (this.queuedSamples > 48000 && this.chunks.length > 1) {
        this.queuedSamples -= this.chunks[0].length - this.offset;
        this.chunks.shift();
        this.offset = 0;
      }
    };
  }

  process(_inputs, outputs) {
    const channel = outputs[0][0];
    channel.fill(0);
    let written = 0;
    while (written < channel.length && this.chunks.length) {
      const chunk = this.chunks[0];
      const available = chunk.length - this.offset;
      const count = Math.min(channel.length - written, available);
      channel.set(chunk.subarray(this.offset, this.offset + count), written);
      written += count;
      this.offset += count;
      this.queuedSamples -= count;
      if (this.offset >= chunk.length) {
        this.chunks.shift();
        this.offset = 0;
      }
    }
    return true;
  }
}

registerProcessor('quartic-pcm-input', QuarticPcmInput);
