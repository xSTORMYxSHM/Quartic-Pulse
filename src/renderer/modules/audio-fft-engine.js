(() => {
  'use strict';

  function fftInPlace(real, imaginary) {
    const length = real.length;
    for (let index = 1, reversed = 0; index < length; index++) {
      let bit = length >> 1;
      for (; reversed & bit; bit >>= 1) reversed ^= bit;
      reversed ^= bit;
      if (index < reversed) {
        [real[index], real[reversed]] = [real[reversed], real[index]];
        [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]];
      }
    }
    for (let size = 2; size <= length; size <<= 1) {
      const angle = -2 * Math.PI / size;
      const stepReal = Math.cos(angle);
      const stepImaginary = Math.sin(angle);
      for (let start = 0; start < length; start += size) {
        let twiddleReal = 1;
        let twiddleImaginary = 0;
        for (let offset = 0; offset < size / 2; offset++) {
          const even = start + offset;
          const odd = even + size / 2;
          const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary;
          const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal;
          real[odd] = real[even] - oddReal;
          imaginary[odd] = imaginary[even] - oddImaginary;
          real[even] += oddReal;
          imaginary[even] += oddImaginary;
          const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
          twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
          twiddleReal = nextReal;
        }
      }
    }
  }

  window.QuarticAudioFftEngine = Object.freeze({ fftInPlace });
})();
