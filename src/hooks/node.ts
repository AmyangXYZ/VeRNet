// run as a Web worker
import type {
  Cell,
  Message,
  Packet,
  Statistics,
  PKT_BEACON_PAYLOAD,
  ASSOC_REQ_PAYLOAD,
  ScheduleConfig
} from './typedefs'
import { MSG_TYPES, ADDR, PKT_TYPES, CELL_TYPES } from './typedefs'

const SHARED_CHANNEL = 1
const BEACON_PERIOD = 1 // # of slotframe

// basic information
const self: any = {
  id: 0,
  pos: [],
  joined: false,
  parent: 0,
  rank: 0,
  children: []
}

let ASN = 0

const queue: Packet[] = []

let schedule: Cell[][]

const routingTable: any = []

const stats: Statistics = {
  pkt_seq: -1,
  rx_cnt: 0,
  tx_cnt: 0
}

// handle messages and packets
onmessage = (e: any) => {
  // msg or pkt

  if ('ch' in e.data == false) {
    const msg: Message = e.data
    switch (msg.type) {
      case MSG_TYPES.ASN:
        ASN = msg.payload.asn
        // console.log(`[${self.id}] cur_asn: ${ASN}`)
        // send beacon
        if (self.joined && ASN % (BEACON_PERIOD * (schedule.length - 1)) == 1) {
          queue.push(<Packet>{
            uid: Math.floor(Math.random() * 0xffff),
            type: PKT_TYPES.BEACON,
            ch: SHARED_CHANNEL,
            src: self.id,
            dst: -1,
            seq: ++stats.pkt_seq,
            len: 1,
            payload: <PKT_BEACON_PAYLOAD>{ dodag_id: 1, rank: self.rank }
          })
        }
        checkSchedule()
        break
      case MSG_TYPES.INIT:
        self.id = msg.payload.id
        self.pos = msg.payload.pos
        initSchedule(msg.payload.sch_config)
        if (self.id == ADDR.ROOT) {
          self.joined = true
          schedule[1][SHARED_CHANNEL] = <Cell>{
            slot: 1,
            ch: SHARED_CHANNEL,
            src: self.id,
            dst: ADDR.BROADCAST
          }
        }
        // console.log(`I am node ${self.id}`)
        break
      case MSG_TYPES.SEND:
        queue.push(<Packet>{
          uid: Math.floor(Math.random() * 0xffff),
          type: PKT_TYPES.DATA,
          src: self.id,
          dst: msg.payload.dst,
          seq: ++stats.pkt_seq,
          len: msg.payload.len,
          payload: msg.payload.payload
        })
        break
    }
  } else {
    const pkt: Packet = e.data
    // respond ack
    if (pkt.dst != ADDR.BROADCAST && pkt.type != PKT_TYPES.ACK && pkt.src != ADDR.CONTROLLER) {
      const ack: Packet = { ...pkt }
      ack.type = PKT_TYPES.ACK
      ack.src = self.id
      ack.dst = pkt.src
      ack.len = 0
      ack.payload = {}
      postMessage(ack)
    }

    switch (pkt.type) {
      case PKT_TYPES.ACK:
        if (queue[0] != null && queue[0].uid == pkt.uid) {
          // console.log('recieved ack', pkt.uid)
          queue.shift()
        }
        break

      case PKT_TYPES.BEACON:
        // console.log(`[${self.id}] received beacon (DIO) from node ${pkt.src}`)
        stats.rx_cnt++
        if (self.id != ADDR.ROOT && !self.joined) {
          // choose it as parent and send DAO
          self.parent = pkt.src
          self.rank = pkt.payload.rank + 1
          queue.push(<Packet>{
            uid: Math.floor(Math.random() * 0xffff),
            type: PKT_TYPES.ASSOC_REQ,
            src: self.id,
            dst: self.parent,
            seq: ++stats.pkt_seq,
            len: 2,
            payload: <ASSOC_REQ_PAYLOAD>{ id: self.id, parent: self.parent }
          })
        }
        break

      case PKT_TYPES.ASSOC_REQ:
        // console.log(`[${self.id}] DAO from [${pkt.src}]`)
        // forward to parent or controller
        if (self.id != ADDR.ROOT) {
          pkt.src = self.id
          pkt.dst = self.parent
          pkt.seq = ++stats.pkt_seq
          queue.push(pkt)
        } else {
          postMessage(<Message>{
            type: MSG_TYPES.ASSOC_REQ,
            payload: pkt.payload
          })
        }
        break

      case PKT_TYPES.ASSOC_RSP:
        if (pkt.payload.id == self.id && pkt.payload.permit) {
          self.joined = true
          for (const cell of pkt.payload.schedule) {
            schedule[cell.slot][cell.ch] = cell
          }
        }
        if (pkt.payload.parent == self.id && pkt.payload.permit) {
          self.children.push(pkt.payload.id)
        }
        if (pkt.payload.id != self.id) {
          // forward

          pkt.src = self.id
          if (self.children.indexOf(pkt.payload.id) > -1) {
            pkt.dst = pkt.payload.id
            pkt.seq = ++stats.pkt_seq
            queue.push(pkt)
          } else {
            // to replace this flooding with routing table
            for (let i = 0; i < self.children.length; i++) {
              pkt.dst = self.children[i]
              pkt.seq = ++stats.pkt_seq
              queue.push(pkt)
            }
          }
        }
        break
      case PKT_TYPES.DATA:
        break
    }
  }
}

function initSchedule(config: ScheduleConfig) {
  schedule = new Array<Cell[]>(config.num_slots + 1)
  for (let s = 1; s <= config.num_slots; s++) {
    schedule[s] = new Array<Cell>(config.num_channels + 1)
  }

  // shared slots
  for (let s = 0; s < config.num_shared_slots; s++) {
    schedule[s + 1][SHARED_CHANNEL] = <Cell>{
      type: CELL_TYPES.SHARED,
      slot: s,
      ch: SHARED_CHANNEL,
      src: self.id,
      dst: ADDR.ANY
    }
  }
}

// check if have available slot for tx
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
          ((cell.dst == ADDR.ANY && pkt.dst != ADDR.BROADCAST) || cell.dst == pkt.dst)
        ) {
          pkt.ch = ch
          pkt.asn = ASN
          pkt.time = +Date.now()
          postMessage(pkt)
          stats.tx_cnt++

          // no need of ack, transmission finished
          if (pkt.dst == ADDR.BROADCAST || pkt.type == PKT_TYPES.ACK) {
            queue.shift()
          }
          break
        }
      }
    }
  }
}
