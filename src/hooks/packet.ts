export interface Packet {
  uid: number
  type: number
  ch: number
  src: number
  dst: number
  seq: number
  time: number
  len: number
  payload: number[]
}

export enum PKT_TYPE {
  CMD,
  MGMT,
  DATA
}

export enum CMD_TYPE {
  ASSIGN_ID,
  BEACON,
  SEND,
  STAT
}

export function pkt2Buf(pkt: Packet): ArrayBuffer {
  // console.log(pkt)
  // Convert the numeric properties (including time) to an ArrayBuffer
  const buffer: ArrayBuffer = new ArrayBuffer(8 * 4) // 8 numbers, 4 bytes each
  const view: Uint32Array = new Uint32Array(buffer)
  view[0] = pkt.uid
  view[1] = pkt.type
  view[2] = pkt.ch
  view[3] = pkt.src
  view[4] = pkt.dst
  view[5] = pkt.seq
  view[6] = pkt.time
  view[7] = pkt.len

  // Convert the payload to an ArrayBuffer
  const payloadBuffer: ArrayBuffer = new ArrayBuffer(pkt.payload.length * 4) // A Uint32 has 4 bytes
  const payloadView: Uint32Array = new Uint32Array(payloadBuffer)
  pkt.payload.forEach((val: number, index: number) => (payloadView[index] = val))

  // Combine all the buffers into a single ArrayBuffer
  const combinedBuffer: ArrayBuffer = new ArrayBuffer(buffer.byteLength + payloadBuffer.byteLength)
  new Uint8Array(combinedBuffer).set(new Uint8Array(buffer), 0)
  new Uint8Array(combinedBuffer).set(new Uint8Array(payloadBuffer), buffer.byteLength)

  return combinedBuffer
}

export function buf2Pkt(buf: ArrayBuffer): Packet {
  // Initialize a new Packet
  const pkt: Packet = {
    uid: 0,
    type: 0,
    ch: 0,
    src: 0,
    dst: 0,
    seq: 0,
    time: 0,
    len: 0,
    payload: []
  }

  // Convert the first part of the buffer back to the numeric properties
  const view: Uint32Array = new Uint32Array(buf, 0, 8)
  pkt.uid = view[0]
  pkt.type = view[1]
  pkt.ch = view[2]
  pkt.src = view[3]
  pkt.dst = view[4]
  pkt.seq = view[5]
  pkt.time = view[6]
  pkt.len = view[7]

  // Convert the payload back from the buffer
  const payloadView: Uint32Array = new Uint32Array(buf, 8 * 4, pkt.len)
  pkt.payload = Array.from(payloadView)

  return pkt
}
