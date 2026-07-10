const FNV_PRIME = 16777619;
const FNV_OFFSET = 2166136261;

function fnv1a(str: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

function hash1(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

function hash2(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i) ^ 0x9e3779b9;
    h |= 0;
  }
  return h >>> 0;
}

export class BloomFilter {
  private bits: Uint8Array;
  private numHashes: number;
  private _size: number;

  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    this._size = Math.ceil(-(expectedItems * Math.log(falsePositiveRate)) / (Math.LN2 * Math.LN2));
    this.numHashes = Math.ceil((this._size / expectedItems) * Math.LN2);
    this.bits = new Uint8Array(Math.ceil(this._size / 8));
  }

  get size(): number { return this._size; }

  add(str: string): void {
    const h0 = fnv1a(str);
    const h1 = hash1(str);
    const h2 = hash2(str);
    for (let i = 0; i < this.numHashes; i++) {
      const idx = (h0 + i * h1 + i * i * h2) % this._size;
      this.bits[idx >> 3]! |= (1 << (idx & 7));
    }
  }

  mightContain(str: string): boolean {
    const h0 = fnv1a(str);
    const h1 = hash1(str);
    const h2 = hash2(str);
    for (let i = 0; i < this.numHashes; i++) {
      const idx = (h0 + i * h1 + i * i * h2) % this._size;
      if (!(this.bits[idx >> 3]! & (1 << (idx & 7)))) return false;
    }
    return true;
  }

  clear(): void {
    this.bits.fill(0);
  }
}
