/** Create a seeded xorshift32 PRNG for deterministic effect output. */
export function createPrng(seed: number) {
  let xorState = ((seed * 2147483647) | 0) || 1;
  return (_n: number) => {
    xorState ^= xorState << 13;
    xorState ^= xorState >> 17;
    xorState ^= xorState << 5;
    return (xorState >>> 0) / 4294967296;
  };
}
