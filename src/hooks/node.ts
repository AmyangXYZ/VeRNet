// run as a Web worker
import type { Packet, Statistics, MGMT_DIO_PAYLOAD, MGMT_DAO_PAYLOAD } from './defs'
import { PKT_TYPE } from './defs'

const BEACON_PERIOD = 5000

const self: any = {
  id: 0,
  pos: [],
  parent: 0,
  rank: [],
  children: []
}

const stats: Statistics = {
  pkt_seq: -1,
  rx_cnt: 0,
  tx_cnt: 0
}

// function report() {
//   postMessage(<Packet>{
//     uid: 0,
//     type: PKT_TYPE.CMD,
//     ch: 0,
//     src: self.id,
//     dst: 0,
//     seq: 0,
//     time: +Date.now(),
//     len: 3,
//     payload: [CMD_TYPE.STAT, stats.rx_cnt, stats.tx_cnt]
//   })
// }

// setInterval(report, 2000)

onmessage = ({ data: pkt }: any) => {
  switch (pkt.type) {
    case PKT_TYPE.CMD_INIT:
      self.id = pkt.payload.id
      self.pos = pkt.payload.pos
      // console.log(`I am node ${self.id}`)
      break
    case PKT_TYPE.CMD_RUN:
      sendBeacon()
      setInterval(() => {
        sendBeacon()
      }, BEACON_PERIOD)
      break
    case PKT_TYPE.CMD_SEND:
      postMessage(<Packet>{
        uid: Math.floor(Math.random() * 0xffff),
        type: PKT_TYPE.DATA,
        src: self.id,
        dst: pkt.dst,
        seq: ++stats.pkt_seq,
        time: +Date.now(),
        len: pkt.payload.length,
        payload: pkt.payload
      })
      break

    case PKT_TYPE.MGMT_DIO:
      console.log(`[${self.id}] received beacon (DIO) from node ${pkt.src}`)
      stats.rx_cnt++
      if (self.parent == 0) {
        self.parent = pkt.src
        postMessage(<Packet>{
          uid: Math.floor(Math.random() * 0xffff),
          type: PKT_TYPE.MGMT_DAO,
          ch: 0,
          src: self.id,
          dst: self.parent,
          seq: ++stats.pkt_seq,
          time: +Date.now(),
          len: 0,
          payload: <MGMT_DAO_PAYLOAD>{}
        })
      }
      break
    case PKT_TYPE.MGMT_DAO:
      console.log(`DAO from [${pkt.src}]`)
      break
    case PKT_TYPE.DATA:
      break
  }
}

function sendBeacon() {
  postMessage(<Packet>{
    uid: Math.floor(Math.random() * 0xffff),
    type: PKT_TYPE.MGMT_DIO,
    ch: Math.floor(Math.random() * 8),
    src: self.id,
    dst: -1,
    seq: ++stats.pkt_seq,
    time: +Date.now(),
    len: 2,
    payload: <MGMT_DIO_PAYLOAD>{ rank: 0 }
  })
  stats.tx_cnt++
}
