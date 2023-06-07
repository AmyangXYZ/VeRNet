// run as a Web worker
import type { Packet, Statistics } from './defs'
import { PKT_TYPE, NODE_CMD } from './defs'

const stats: Statistics = {
  id: 0,
  neighbors: [],
  pkt_seq: 0,
  rx_cnt: 0,
  tx_cnt: 0
}

function report() {
  postMessage(<Packet>{
    type: PKT_TYPE.STAT,
    src: stats.id,
    dst: 0,
    payload: stats
  })
}

// setInterval(report, 2000)

onmessage = (e: any) => {
  const pkt: Packet = e.data
  switch (pkt.type) {
    case PKT_TYPE.CMD:
      switch (pkt.cmd) {
        case NODE_CMD.assign_id:
          stats.id = pkt.payload[0]
          // console.log(`I am node ${id}`)
          break
        case NODE_CMD.beacon:
          postMessage(<Packet>{
            uid: Math.floor(Math.random() * 65535),
            time: +Date.now(),
            ch: Math.floor(Math.random() * 8),
            type: PKT_TYPE.MGMT,
            src: stats.id,
            dst: -1,
            seq: stats.pkt_seq,
            len: 0,
            payload: []
          })
          stats.pkt_seq++
          stats.tx_cnt++
          break
        case NODE_CMD.send:
          postMessage(<Packet>{
            uid: Math.floor(Math.random() * 65535),
            type: PKT_TYPE.DATA,
            src: stats.id,
            dst: pkt.dst,
            payload: pkt.payload,
            seq: stats.pkt_seq,
            len: pkt.payload.length
          })
          stats.pkt_seq++
          break
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
