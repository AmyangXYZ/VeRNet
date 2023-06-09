// run as a Web worker
import type {
  Cell,
  Packet,
  Statistics,
  BEACON_PAYLOAD,
  ASSOC_REQ_PAYLOAD,
  ScheduleConfig
} from './typedefs'
import { PKT_ADDR, PKT_TYPE } from './typedefs'

const BEACON_CHANNEL = 1
const SHARED_CHANNEL = 2
// const BEACON_PERIOD = 5000

// basic information
const self: any = {
  id: 0,
  pos: [],
  parent: 0,
  rank: 0,
  children: []
}

let ASN = 0

const queue: Packet[] = []

let schedule: Cell[][]

const stats: Statistics = {
  pkt_seq: -1,
  rx_cnt: 0,
  tx_cnt: 0
}

// handle packets
onmessage = ({ data: pkt }: any) => {
  switch (pkt.type) {
    case PKT_TYPE.ACK:
      if (queue[0] != null && queue[0].uid == pkt.uid) {
        // console.log('recieved ack', pkt.uid)
        queue.shift()
      }
      break
    case PKT_TYPE.CMD_ASN:
      ASN = pkt.payload.asn
      // console.log(`[${self.id}] cur_asn: ${ASN}`)
      checkSchedule()
      break
    case PKT_TYPE.CMD_INIT:
      self.id = pkt.payload.id
      self.pos = pkt.payload.pos
      initSchedule(pkt.payload.sch_config)
      // console.log(`I am node ${self.id}`)
      break
    case PKT_TYPE.CMD_SEND:
      queue.push(<Packet>{
        uid: Math.floor(Math.random() * 0xffff),
        type: PKT_TYPE.DATA,
        src: self.id,
        dst: pkt.dst,
        seq: ++stats.pkt_seq,
        len: pkt.payload.length,
        payload: pkt.payload
      })
      break

    case PKT_TYPE.BEACON:
      // console.log(`[${self.id}] received beacon (DIO) from node ${pkt.src}`)
      stats.rx_cnt++
      if (self.id != 1 && self.parent == 0) {
        // choose it as parent and send DAO
        self.parent = pkt.src
        self.rank = pkt.payload.rank + 1
        queue.push(<Packet>{
          uid: Math.floor(Math.random() * 0xffff),
          type: PKT_TYPE.ASSOC_REQ,
          src: self.id,
          dst: self.parent,
          seq: ++stats.pkt_seq,
          len: 2,
          payload: <ASSOC_REQ_PAYLOAD>{ id: self.id, parent: self.parent }
        })
      }
      break
    case PKT_TYPE.ASSOC_REQ: {
      // console.log(`[${self.id}] DAO from [${pkt.src}]`)

      // response ack
      const ack: Packet = { ...pkt }
      ack.type = PKT_TYPE.ACK
      ack.src = self.id
      ack.dst = pkt.src
      ack.len = 0
      ack.payload = {}
      postMessage(ack)

      if (pkt.src == pkt.payload.id) {
        self.children.push(pkt.src)
      }
      // forward to parent to reach the controller
      const dao: Packet = { ...pkt }
      dao.src = self.id
      dao.dst = self.parent
      dao.seq = ++stats.pkt_seq
      if (self.id == 1 && dao.dst == PKT_ADDR.CONTROLLER) {
        postMessage(dao)
      } else {
        queue.push(dao)
      }
      break
    }
    case PKT_TYPE.ASSOC_RSP:
      if (pkt.dst == self.id) {
        for (const cell of pkt.payload.schedule) {
          schedule[cell.slot][cell.ch] = cell
        }
        sendBeacon()
      }
      break
    case PKT_TYPE.DATA: {
      const ack: Packet = { ...pkt }
      ack.type = PKT_TYPE.ACK
      ack.src = self.id
      ack.dst = pkt.src
      ack.payload = {}
      postMessage(ack)
      break
    }
  }
}

function sendBeacon() {
  queue.push(<Packet>{
    uid: Math.floor(Math.random() * 0xffff),
    type: PKT_TYPE.BEACON,
    ch: BEACON_CHANNEL,
    src: self.id,
    dst: -1,
    seq: ++stats.pkt_seq,
    len: 1,
    payload: <BEACON_PAYLOAD>{ rank: self.rank }
  })
}

function initSchedule(config: ScheduleConfig) {
  schedule = new Array<Cell[]>(config.num_slots + 1)
  for (let s = 1; s <= config.num_slots; s++) {
    schedule[s] = new Array<Cell>(config.num_channels + 1)
  }

  // shared slots
  for (let s = 0; s < config.num_shared_slots; s++) {
    schedule[s + 1][SHARED_CHANNEL] = <Cell>{ src: self.id, dst: PKT_ADDR.ANY }
  }
}

function checkSchedule() {
  let slot = ASN % (schedule.length - 1)
  if (slot == 0) slot++

  if (queue.length > 0) {
    const pkt = queue[0]
    if (pkt != null) {
      for (let ch = 1; ch <= schedule[slot].length; ch++) {
        const cell = schedule[slot][ch]
        if (
          cell != null &&
          cell.src == pkt.src &&
          ((cell.dst == PKT_ADDR.ANY && pkt.dst != PKT_ADDR.BROADCAST) || cell.dst == pkt.dst)
        ) {
          pkt.ch = ch
          pkt.asn = ASN
          pkt.time = +Date.now()
          postMessage(pkt)
          stats.tx_cnt++

          // no need of ack, transmission finished
          if (pkt.dst == PKT_ADDR.BROADCAST || pkt.type == PKT_TYPE.ACK) {
            queue.shift()
          }
          break
        }
      }
    }
  }
}
