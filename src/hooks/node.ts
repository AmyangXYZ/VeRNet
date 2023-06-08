// run as a Web worker
import type { Packet, Statistics } from './defs'
import { PKT_TYPE, CMD_TYPE } from './defs'

const BEACON_PERIOD = 5000

const self: any = {
  id: 0,
  pkt_seq: 0,
  neighbors: []
}

const stats: Statistics = {
  rx_cnt: 0,
  tx_cnt: 0
}

function report() {
  postMessage(<Packet>{
    uid: 0,
    type: PKT_TYPE.CMD,
    ch: 0,
    src: self.id,
    dst: 0,
    seq: 0,
    time: +Date.now(),
    len: 3,
    payload: [CMD_TYPE.STAT, stats.rx_cnt, stats.tx_cnt]
  })
}

// setInterval(report, 2000)

onmessage = ({ data: pkt }: any) => {
  switch (pkt.type) {
    case PKT_TYPE.CMD:
      switch (pkt.payload[0]) {
        case CMD_TYPE.ASSIGN_ID:
          self.id = pkt.payload[1]
          // console.log(`I am node ${self.id}`)
          break
        case CMD_TYPE.BEACON: {
          sendBeacon()
          setInterval(() => {
            sendBeacon()
          }, BEACON_PERIOD)
          break
        }
        case CMD_TYPE.SEND: {
          postMessage(<Packet>{
            uid: Math.floor(Math.random() * 65535),
            type: PKT_TYPE.DATA,
            src: self.id,
            dst: pkt.dst,
            seq: self.pkt_seq,
            time: +Date.now(),
            len: pkt.payload.length,
            payload: pkt.payload
          })
          self.pkt_seq++
          break
        }
      }
      break
    case PKT_TYPE.MGMT:
      // console.log(`[${stats.id}] received beacon from node ${pkt.src}`)
      stats.rx_cnt++
      self.neighbors.push(pkt.src)

      postMessage(<Packet>{
        uid: 0,
        type: PKT_TYPE.CMD,
        ch: 0,
        src: self.id,
        dst: 0,
        seq: 0,
        time: +Date.now(),
        len: self.neighbors.length + 1,
        payload: [CMD_TYPE.NEIGHBOR, ...self.neighbors]
      })
      break
    case PKT_TYPE.DATA:
      break
  }
}

function sendBeacon() {
  postMessage(<Packet>{
    uid: Math.floor(Math.random() * 0xffff),
    type: PKT_TYPE.MGMT,
    ch: Math.floor(Math.random() * 8),
    src: self.id,
    dst: -1,
    seq: self.pkt_seq,
    time: +Date.now(),
    len: 0,
    payload: []
  })
  self.pkt_seq++
  stats.tx_cnt++
}
