// run as a Web worker
import type { Packet, Statistics } from './defs'
import { PKT_TYPE, NODE_AXN } from './defs'

const stats: Statistics = {
  id: 0,
  neighbors: [],
  rx_cnt: 0,
  tx_cnt: 0
}
const MAX_NEIGHBOR = 2

setTimeout(() => {
  postMessage(<Packet>{ type: PKT_TYPE.Stat, src: stats.id, dst: 0, payload: stats })
}, 2000)

onmessage = (e: any) => {
  const pkt: Packet = e.data
  switch (pkt.type) {
    case PKT_TYPE.Action:
      switch (pkt.act) {
        case NODE_AXN.assign_id:
          stats.id = pkt.payload[0]
          // console.log(`I am node ${id}`)
          break
        case NODE_AXN.beacon:
          postMessage(<Packet>{ type: PKT_TYPE.Mgmt, src: stats.id, dst: -1 })
          break
        case NODE_AXN.send:
          postMessage(<Packet>{
            type: PKT_TYPE.Data,
            src: stats.id,
            dst: pkt.dst,
            payload: pkt.payload
          })
          break
      }
      break
    case PKT_TYPE.Mgmt:
      // console.log(`[${id}] received beacon from node ${pkt.src}`)
      stats.rx_cnt++
      if (stats.neighbors.length < MAX_NEIGHBOR) {
        stats.neighbors.push(pkt.src)
        postMessage(<Packet>{ type: PKT_TYPE.Mgmt, src: stats.id, dst: pkt.dst })
        stats.tx_cnt++
      }
      break
    case PKT_TYPE.Data:
      break
  }
}
