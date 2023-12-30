export class SeededRandom {
  private m_w: number
  private m_z: number
  private mask: number = 0xffffffff

  constructor(seed: number) {
    this.m_w = (123456789 + seed) & this.mask
    this.m_z = (987654321 - seed) & this.mask
  }

  public next(): number {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >>> 16)) & this.mask
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >>> 16)) & this.mask

    let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0
    result /= 4294967296
    return result
  }
}
