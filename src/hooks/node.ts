// run as a Web worker
import type { Statistics } from './defs'
import type { Packet } from './packet'
import { PKT_TYPE, CMD_TYPE, pkt2Buf, buf2Pkt } from './packet'

const stats: Statistics = {
  id: 0,
  neighbors: [],
  pkt_seq: 0,
  rx_cnt: 0,
  tx_cnt: 0
}

function report() {
  const buf: ArrayBuffer = pkt2Buf(<Packet>{
    type: PKT_TYPE.CMD,
    src: stats.id,
    dst: 0,
    time: +Date.now(),
    len: stats.neighbors.length,
    payload: stats.neighbors
  })
  postMessage(buf, [buf])
}

// setInterval(report, 2000)

onmessage = (e: any) => {
  const pkt: Packet = buf2Pkt(e.data)
  switch (pkt.type) {
    case PKT_TYPE.CMD:
      switch (pkt.payload[0]) {
        case CMD_TYPE.ASSIGN_ID:
          stats.id = pkt.payload[1]
          // console.log(`I am node ${stats.id}`)
          break
        case CMD_TYPE.BEACON: {
          const buf: ArrayBuffer = pkt2Buf(<Packet>{
            uid: Math.floor(Math.random() * 0xffff),
            type: PKT_TYPE.MGMT,
            ch: Math.floor(Math.random() * 8),
            src: stats.id,
            dst: 0xffff,
            seq: stats.pkt_seq,
            time: +Date.now(),
            len: 0,
            payload: []
          })
          postMessage(buf, [buf])
          stats.pkt_seq++
          stats.tx_cnt++
          break
        }
        case CMD_TYPE.SEND: {
          const buf: ArrayBuffer = pkt2Buf(<Packet>{
            uid: Math.floor(Math.random() * 65535),
            type: PKT_TYPE.DATA,
            src: stats.id,
            dst: pkt.dst,
            seq: stats.pkt_seq,
            time: +Date.now(),
            len: pkt.payload.length,
            payload: pkt.payload
          })
          postMessage(buf, [buf])
          stats.pkt_seq++
          break
        }
      }
      break
    case PKT_TYPE.MGMT:
      // console.log(`[${stats.id}] received beacon from node ${pkt.src}`)
      stats.rx_cnt++
      stats.neighbors.push(pkt.src)
      report()

      break
    case PKT_TYPE.DATA:
      break
  }
}
