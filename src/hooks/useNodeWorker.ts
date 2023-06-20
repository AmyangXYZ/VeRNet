// run as a Web worker
import type {
  Cell,
  Message,
  Packet,
  PKT_BEACON_PAYLOAD,
  ASSOC_REQ_PAYLOAD,
  ScheduleConfig
} from './useDefs'
import { MSG_TYPES, ADDR, PKT_TYPES, CELL_TYPES } from './useDefs'

const self: any = {
  id: 0,
  joined: false,
  joining: false,
  parent: 0,
  rank: 0,
  children: <number[]>[],
  sch_config: <ScheduleConfig>{},
  schedule: <Cell[][]>[],
  queue: <Packet[]>[],
  routingTable: {}, // dst: next-hop
  pkt_seq: -1,
  tx_cnt: 0,
  rx_cnt: 0
}

const neighbors: any = {} // record if neighbor has joined
neighbors[ADDR.BROADCAST] = true

let ASN = 0

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
        if (
          self.joined &&
          ASN % (self.sch_config.beacon_period * (self.schedule.length - 1)) == 1
        ) {
          self.queue.push(<Packet>{
            uid: Math.floor(Math.random() * 0xffff),
            type: PKT_TYPES.BEACON,
            src: self.id,
            dst: -1,
            seq: ++self.pkt_seq,
            len: 1,
            payload: <PKT_BEACON_PAYLOAD>{ dodag_id: 1, rank: self.rank }
          })
        }
        checkScheduleTx()

        // done
        postMessage(<Message>{
          type: MSG_TYPES.DONE
        })
        postMessage(<Message>{
          type: MSG_TYPES.STAT,
          payload: self
        })
        break
      case MSG_TYPES.INIT:
        self.id = msg.payload.id
        self.pos = msg.payload.pos
        self.sch_config = msg.payload.sch_config
        initSchedule()
        if (self.id == ADDR.ROOT) {
          self.joined = true
        }
        break
      case MSG_TYPES.SEND:
        self.queue.push(<Packet>{
          uid: Math.floor(Math.random() * 0xffff),
          type: PKT_TYPES.DATA,
          src: self.id,
          dst: msg.payload.dst,
          seq: ++self.pkt_seq,
          len: msg.payload.len,
          payload: msg.payload.payload
        })
        break
    }
  } else {
    const pkt: Packet = e.data

    // check if the radio module is on and pkt.dst is self
    if (checkScheduleRx(pkt)) {
      // respond ack
      if (pkt.dst != ADDR.BROADCAST && pkt.type != PKT_TYPES.ACK && pkt.src != ADDR.CONTROLLER) {
        const ack: Packet = { ...pkt }
        ack.type = PKT_TYPES.ACK
        ack.src = self.id
        ack.dst = pkt.src
        ack.len = 0
        ack.payload = {}
        // send immediately
        postMessage(ack)
      }

      // update routing table
      self.routingTable[pkt.src] = pkt.src

      switch (pkt.type) {
        case PKT_TYPES.ACK:
          if (self.queue[0] != undefined && self.queue[0].uid == pkt.uid) {
            // console.log('recieved ack', pkt.uid)
            if (
              self.queue[0].type == PKT_TYPES.ASSOC_RSP &&
              self.queue[0].payload.parent == self.id
            ) {
              neighbors[self.queue[0].payload.id] = true
            }
            self.queue.shift()
          }
          break

        case PKT_TYPES.BEACON:
          // console.log(`[${self.id}] received beacon (DIO) from node ${pkt.src}`)
          if (self.id != ADDR.ROOT && !self.joined && !self.joining) {
            self.joining = true
            self.rank = pkt.payload.rank + 1
            self.queue.push(<Packet>{
              uid: Math.floor(Math.random() * 0xffff),
              type: PKT_TYPES.ASSOC_REQ,
              src: self.id,
              dst: pkt.src,
              seq: ++self.pkt_seq,
              len: 2,
              payload: <ASSOC_REQ_PAYLOAD>{ id: self.id, parent: pkt.src }
            })
          }
          break

        case PKT_TYPES.ASSOC_REQ:
          // console.log(`[${self.id}] DAO from [${pkt.src}]`)

          if (self.routingTable[pkt.payload.id] == undefined) {
            self.routingTable[pkt.payload.id] = pkt.src
          }

          // forward to parent or controller
          if (self.id != ADDR.ROOT) {
            pkt.src = self.id
            pkt.dst = self.parent
            pkt.seq = ++self.pkt_seq
            self.queue.push(pkt)
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
            self.joining = false
            self.parent = pkt.payload.parent
            neighbors[self.parent] = true
            self.routingTable[ADDR.CONTROLLER] = self.parent

            for (const cell of pkt.payload.schedule) {
              self.schedule[cell.slot][cell.ch] = cell
            }
            postMessage(<Message>{
              type: MSG_TYPES.STAT,
              payload: self
            })

            self.queue.push(<Packet>{
              uid: Math.floor(Math.random() * 0xffff),
              type: PKT_TYPES.BEACON,
              src: self.id,
              dst: -1,
              seq: ++self.pkt_seq,
              len: 1,
              payload: <PKT_BEACON_PAYLOAD>{ dodag_id: 1, rank: self.rank }
            })
          }
          if (pkt.payload.parent == self.id && pkt.payload.permit) {
            self.children.push(pkt.payload.id)
            for (const cell of pkt.payload.schedule) {
              self.schedule[cell.slot][cell.ch] = cell
            }
          }
          if (pkt.payload.id != self.id) {
            // forward
            pkt.src = self.id
            if (self.children.indexOf(pkt.payload.id) > -1) {
              pkt.dst = pkt.payload.id
              pkt.seq = ++self.pkt_seq
              self.queue.push(pkt)
            } else {
              // not related to self
              if (self.routingTable[pkt.payload.id] != undefined) {
                pkt.dst = self.routingTable[pkt.payload.id]
                pkt.seq = ++self.pkt_seq
                self.queue.push(pkt)
              }
            }
          }
          break
        case PKT_TYPES.DATA:
          break
      }
    }
  }
}

function initSchedule() {
  self.schedule = new Array<Cell[]>(self.sch_config.num_slots + 1)
  for (let s = 1; s <= self.sch_config.num_slots; s++) {
    self.schedule[s] = new Array<Cell>(self.sch_config.num_channels + 1)
  }

  // root's beacon
  if (self.id == ADDR.ROOT) {
    self.schedule[1][self.sch_config.beacon_channel] = <Cell>{
      slot: 1,
      ch: self.sch_config.beacon_channel,
      src: self.id,
      dst: ADDR.BROADCAST
    }
  }
  // shared slots
  for (let s = 2; s < 2 + self.sch_config.num_shared_slots; s++) {
    self.schedule[s][self.sch_config.shared_channel] = <Cell>{
      type: CELL_TYPES.SHARED,
      slot: s,
      ch: self.sch_config.shared_channel,
      src: self.id,
      dst: ADDR.ANY
    }
  }
}

// check if have available slot for tx
function checkScheduleTx() {
  let slot = ASN % (self.schedule.length - 1)
  if (slot == 0) slot = self.schedule.length - 1

  if (self.queue.length > 0) {
    const pkt = self.queue[0]
    if (pkt != undefined) {
      // self or dst not hasn't joined, use shared slot
      if (!self.joined || neighbors[pkt.dst] == undefined) {
        const cell = self.schedule[slot][self.sch_config.shared_channel]
        if (cell != undefined && cell.type == CELL_TYPES.SHARED) {
          pkt.ch = self.sch_config.shared_channel
          pkt.asn = ASN
          pkt.time = +Date.now()
          pkt.len = JSON.stringify(pkt.payload).length
          postMessage(pkt)
          self.tx_cnt++
        }
      } else {
        for (let ch = 1; ch <= self.schedule[slot].length; ch++) {
          const cell = self.schedule[slot][ch]
          if (cell != undefined && cell.dst == pkt.dst) {
            pkt.ch = ch
            pkt.asn = ASN
            pkt.time = +Date.now()
            pkt.len = JSON.stringify(pkt.payload).length
            postMessage(pkt)
            self.tx_cnt++

            // no need of ack, transmission has finished
            if (pkt.dst == ADDR.BROADCAST || pkt.type == PKT_TYPES.ACK) {
              self.queue.shift()
            }
            break
          }
        }
      }
    }
  }
}

// check if is ready for rx
function checkScheduleRx(pkt: Packet): boolean {
  // nodes haven't joined are always active
  if (!self.joined || pkt.type == PKT_TYPES.ACK || pkt.src == ADDR.CONTROLLER) return true

  let slot = ASN % (self.schedule.length - 1)
  if (slot == 0) slot = self.schedule.length - 1

  for (let ch = 1; ch <= self.schedule[slot].length; ch++) {
    const cell = self.schedule[slot][ch]
    if (
      cell != undefined &&
      (cell.src == pkt.src || pkt.dst == ADDR.BROADCAST || cell.type == CELL_TYPES.SHARED)
    ) {
      self.rx_cnt++
      return true
    }
  }
  return false
}
