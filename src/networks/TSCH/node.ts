// run as a webworker
import type {
  ScheduleConfig,
  Cell,
  INIT_MSG_PAYLOAD,
  BEACON_PKT_PAYLOAD,
  ASSOC_REQ_PKT_PAYLOAD,
  ASN_MSG_PAYLOAD,
  ASSOC_RSP_PKT_PAYLOAD
} from './typedefs'
import { MSG_TYPES, ADDR, CELL_TYPES, PKT_TYPES } from './typedefs'
import type { Packet, Message, MsgHandler, PktHandler } from '../typedefs'

class TSCHNode {
  id: number = 0
  joined: boolean = false
  joining: boolean = false
  parent: number = 0
  rank: number = 0
  children: number[] = []
  sch_config: ScheduleConfig = <ScheduleConfig>{}
  schedule: Cell[][] = []
  queue: Packet[] = []
  joinedNeighbors: { [id: number]: boolean } = {}
  routingTable: { [dst: number]: number } = {}
  pkt_seq: number = 0
  tx_cnt: number = 0
  rx_cnt: number = 0
  ASN: number = 0
  msgHandlers: { [type: number]: MsgHandler } = {}
  pktHandlers: { [type: number]: PktHandler } = {}

  constructor() {
    this.joinedNeighbors[ADDR.BROADCAST] = true

    this.registerMsgHandler(MSG_TYPES.ASN, this.asnMsgHandler)
    this.registerMsgHandler(MSG_TYPES.INIT, this.initMsgHandler)

    this.registerPktHandler(PKT_TYPES.ACK, this.ackPktHandler)
    this.registerPktHandler(PKT_TYPES.BEACON, this.beaconPktHandler)
    this.registerPktHandler(PKT_TYPES.ASSOC_REQ, this.assocReqPktHandler)
    this.registerPktHandler(PKT_TYPES.ASSOC_RSP, this.assocRspPktHandler)
  }

  registerMsgHandler(type: number, handler: MsgHandler) {
    this.msgHandlers[type] = handler
  }
  registerPktHandler(type: number, handler: PktHandler) {
    this.pktHandlers[type] = handler
  }

  run() {
    onmessage = (e: any) => {
      if ('ch' in e.data == false) {
        const msg: Message = e.data
        if (this.msgHandlers[msg.type] != undefined) {
          this.msgHandlers[msg.type](msg)
        } else {
          console.log('!! undefined message type:', msg.type)
        }
      } else {
        const pkt: Packet = e.data
        if (this.checkSchRx(pkt)) {
          this.respondAck(pkt)

          // update routing table
          this.routingTable[pkt.src] = pkt.src

          if (this.pktHandlers[pkt.type] != undefined) {
            this.pktHandlers[pkt.type](pkt)
          } else {
            console.log('!! undefined packet type:', pkt.type)
          }
        }
      }
    }
  }

  respondAck(pkt: Packet) {
    if (pkt.dst != ADDR.BROADCAST && pkt.src != ADDR.CONTROLLER && pkt.type != PKT_TYPES.ACK) {
      const ack: Packet = { ...pkt }
      ack.type = PKT_TYPES.ACK
      ack.src = this.id
      ack.dst = pkt.src
      ack.len = 0
      ack.payload = {}
      // send immediately, in the same time slot
      postMessage(ack)
    }
  }
  checkSchTx() {
    const slot = this.ASN % this.sch_config.num_slots || this.sch_config.num_slots
    if (this.queue.length > 0) {
      const pkt = this.queue[0]
      if (this.joined && this.joinedNeighbors[pkt.dst]) {
        // use dedicate cells
        for (let ch = 1; ch <= this.schedule[slot].length; ch++) {
          const cell = this.schedule[slot][ch]
          if (cell != undefined && cell.dst == pkt.dst) {
            pkt.ch = ch
            pkt.asn = this.ASN
            pkt.len = JSON.stringify(pkt.payload).length
            postMessage(pkt)
            this.tx_cnt++

            // no need of ack, transmission has finished
            if (pkt.dst == ADDR.BROADCAST) {
              this.queue.shift()
            }
            break
          }
        }
      } else {
        // use shared cells
        const cell = this.schedule[slot][this.sch_config.shared_channel]
        if (cell != undefined && cell.type == CELL_TYPES.SHARED) {
          pkt.ch = this.sch_config.shared_channel
          pkt.asn = this.ASN
          pkt.len = JSON.stringify(pkt.payload).length
          postMessage(pkt)
          this.tx_cnt++
        }
      }
    }
  }
  checkSchRx(pkt: Packet): boolean {
    if (!this.joined || pkt.type == PKT_TYPES.ACK || pkt.src == ADDR.CONTROLLER) {
      return true
    }
    const slot = this.ASN % this.sch_config.num_slots || this.sch_config.num_slots
    for (const cell of this.schedule[slot]) {
      if (
        cell != undefined &&
        (cell.src == pkt.src || pkt.dst == ADDR.BROADCAST || cell.type == CELL_TYPES.SHARED)
      ) {
        this.rx_cnt++
        return true
      }
    }
    return false
  }

  asnMsgHandler = (msg: Message) => {
    const payload: ASN_MSG_PAYLOAD = msg.payload
    this.ASN = payload.asn
    if (
      this.joined &&
      this.ASN % (this.sch_config.beacon_period * this.sch_config.num_slots) == 1
    ) {
      this.queue.push(<Packet>{
        uid: Math.floor(Math.random() * 0xffff),
        type: PKT_TYPES.BEACON,
        src: this.id,
        dst: -1,
        seq: ++this.pkt_seq,
        len: 1,
        payload: <BEACON_PKT_PAYLOAD>{ pan_id: 1, rank: this.rank }
      })
    }
    this.checkSchTx()

    // done
    postMessage(<Message>{
      type: MSG_TYPES.DONE
    })
    postMessage(<Message>{
      type: MSG_TYPES.STAT,
      src: this.id,
      dst: ADDR.CONTROLLER,
      payload: JSON.parse(JSON.stringify(this))
    })
  }
  initMsgHandler = (msg: Message) => {
    const payload: INIT_MSG_PAYLOAD = msg.payload
    this.id = payload.id
    this.joined = this.id == ADDR.ROOT
    this.sch_config = payload.sch_config
    this.schedule = new Array<Cell[]>(this.sch_config!.num_slots + 1)
    for (let s = 1; s <= this.sch_config!.num_slots; s++) {
      this.schedule[s] = new Array<Cell>(this.sch_config!.num_channels + 1)
    }
    // init schedule
    if (this.id == ADDR.ROOT) {
      this.schedule[1][this.sch_config.beacon_channel] = <Cell>{
        slot: 1,
        ch: this.sch_config.beacon_channel,
        src: this.id,
        dst: ADDR.BROADCAST
      }
    }
    // shared slots
    for (let s = 2; s < 2 + this.sch_config.num_shared_slots; s++) {
      this.schedule[s][this.sch_config.shared_channel] = <Cell>{
        type: CELL_TYPES.SHARED,
        slot: s,
        ch: this.sch_config.shared_channel,
        src: this.id,
        dst: ADDR.ANY
      }
    }
  }

  ackPktHandler = (ack: Packet) => {
    if (this.queue[0] != undefined && this.queue[0].uid == ack.uid) {
      if (
        this.queue[0].type == PKT_TYPES.ASSOC_RSP &&
        this.queue[0].payload.parent == this.id &&
        this.queue[0].payload.permit
      ) {
        this.joinedNeighbors[this.queue[0].payload.id] = true
      }
      this.queue.shift()
    }
  }
  beaconPktHandler = (pkt: Packet) => {
    if (!this.joined && !this.joining) {
      const payload: BEACON_PKT_PAYLOAD = pkt.payload
      this.joining = true
      this.rank = payload.rank + 1
      const assoc_req = <Packet>{
        uid: Math.floor(Math.random() * 0xffff),
        type: PKT_TYPES.ASSOC_REQ,
        src: this.id,
        dst: pkt.src,
        seq: ++this.pkt_seq,
        payload: <ASSOC_REQ_PKT_PAYLOAD>{ id: this.id, parent: pkt.src }
      }
      this.queue.push(assoc_req)
    }
  }
  assocReqPktHandler = (pkt: Packet) => {
    const payload: ASSOC_REQ_PKT_PAYLOAD = pkt.payload
    // update routing table
    if (this.routingTable[payload.id] == undefined) {
      this.routingTable[payload.id] = pkt.src
    }
    if (this.id != ADDR.ROOT) {
      // forward to parent
      pkt.src = this.id
      pkt.dst = this.parent
      pkt.seq = ++this.pkt_seq
      this.queue.push(pkt)
    } else {
      // send to controller
      postMessage(<Message>{
        type: MSG_TYPES.ASSOC_REQ,
        src: this.id,
        dst: ADDR.CONTROLLER,
        payload: pkt.payload
      })
    }
  }
  assocRspPktHandler = (pkt: Packet) => {
    const payload: ASSOC_RSP_PKT_PAYLOAD = pkt.payload
    if (payload.id == this.id) {
      if (payload.permit) {
        this.joined = true
        this.joining = false
        this.parent = payload.parent
        this.joinedNeighbors[this.parent] = true
        this.routingTable[ADDR.CONTROLLER] = this.parent

        for (const cell of payload.cell_list) {
          this.schedule[cell.slot][cell.ch] = cell
        }

        postMessage(<Message>{
          type: MSG_TYPES.STAT,
          src: this.id,
          dst: ADDR.CONTROLLER,
          payload: JSON.parse(JSON.stringify(this))
        })

        this.queue.push(<Packet>{
          uid: Math.floor(Math.random() * 0xffff),
          type: PKT_TYPES.BEACON,
          src: this.id,
          dst: -1,
          seq: ++this.pkt_seq,
          len: 1,
          payload: <BEACON_PKT_PAYLOAD>{ pan_id: 1, rank: this.rank }
        })
      } else {
        this.joining = false
      }
    } else if (payload.parent == this.id) {
      if (payload.permit) {
        this.children.push(payload.id)
        for (const cell of payload.cell_list) {
          this.schedule[cell.slot][cell.ch] = cell
        }
      }
    }
    // need forwarding
    if (payload.id != this.id) {
      pkt.src = this.id
      if (this.children.indexOf(pkt.payload.id) > -1) {
        pkt.dst = pkt.payload.id
        pkt.seq = ++this.pkt_seq
        this.queue.push(pkt)
      } else {
        // not related to this
        if (this.routingTable[pkt.payload.id] != undefined) {
          pkt.dst = this.routingTable[pkt.payload.id]
          pkt.seq = ++this.pkt_seq
          this.queue.push(pkt)
        }
      }
    }
  }
}

new TSCHNode().run()
