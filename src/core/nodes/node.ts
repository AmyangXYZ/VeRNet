import {
  MSG_TYPE,
  type InitMsgPayload,
  type Message,
  type MsgHandler,
  type Packet,
  type PktHandler,
  type RoutingTable,
  type RoutingMsgPayload,
  type ASNMsgPayload,
  PKT_TYPE,
  type StatsSubscribePayload,
  type StatsReportPayload
} from '../typedefs'

export class Node {
  id: number = 0
  neighbors: number[] = []
  pkt_seq: number = 0
  rx_cnt: number = 0
  tx_cnt: number = 0
  ASN: number = 0
  queue: Packet[] = []
  routingTable: RoutingTable = {}
  publishingStats: boolean = false

  msgHandlers: { [type: number]: MsgHandler } = {}
  pktHandlers: { [type: number]: PktHandler } = {}

  constructor() {
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
    this.registerMsgHandler(MSG_TYPE.ROUTING, this.routingMsgHandler)
    this.registerMsgHandler(MSG_TYPE.STATS_SUBSCRIBE, this.statsSubscribeHandler)
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
    this.registerPktHandler(PKT_TYPE.DATA, this.dataPktHandler)
  }

  Run() {
    onmessage = (e: any) => {
      if ('uid' in e.data) {
        const pkt: Packet = e.data
        if (this.pktHandlers[pkt.type] != undefined) {
          this.pktHandlers[pkt.type](pkt)
        } else {
          console.log('!! undefined packet type:', pkt.type)
        }
      } else {
        const msg: Message = e.data
        if (this.msgHandlers[msg.type] != undefined) {
          this.msgHandlers[msg.type](msg)
        } else {
          console.log('!! undefined message type:', msg.type)
        }
      }
    }
  }

  registerMsgHandler(type: number, handler: MsgHandler) {
    this.msgHandlers[type] = handler
  }
  registerPktHandler(type: number, handler: PktHandler) {
    this.pktHandlers[type] = handler
  }

  // Basic common handlers, shall be overwritten in child class
  initMsgHandler = (msg: Message) => {
    const payload: InitMsgPayload = msg.payload
    this.id = payload.id
    this.neighbors = payload.neighbors
  }
  routingMsgHandler = (msg: Message) => {
    const payload: RoutingMsgPayload = msg.payload
    this.routingTable = payload
  }
  statsSubscribeHandler = (msg: Message) => {
    const payload: StatsSubscribePayload = msg.payload
    this.publishingStats = payload.flag
    if (this.publishingStats) {
      postMessage(<Message>{
        type: MSG_TYPE.STATS_REPORT,
        payload: <StatsReportPayload>{
          rx_cnt: this.rx_cnt,
          tx_cnt: this.tx_cnt,
          queue_len: this.queue.length,
          queue_head: this.queue.length > 0 ? this.queue[0].uid : undefined
        }
      })
    }
  }
  asnMsgHandler = (msg: Message) => {
    const payload: ASNMsgPayload = msg.payload
    this.ASN = payload.asn

    this.action()

    if (this.publishingStats) {
      postMessage(<Message>{
        type: MSG_TYPE.STATS_REPORT,
        payload: <StatsReportPayload>{
          rx_cnt: this.rx_cnt,
          tx_cnt: this.tx_cnt,
          queue_len: this.queue.length,
          queue_head: this.queue.length > 0 ? this.queue[0].uid : undefined
        }
      })
    }

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
  // main action in each slot
  action = () => {
    if (this.queue.length > 0) {
      const pkt = this.queue.pop()
      postMessage(pkt)
      this.tx_cnt++
    }
  }
  // simple forwarding
  dataPktHandler = (pkt: Packet) => {
    this.rx_cnt++
    if (pkt.e2e_dst != this.id) {
      if (this.routingTable[pkt.e2e_dst] != undefined) {
        pkt.mac_src = this.id
        pkt.mac_dst = this.routingTable[pkt.e2e_dst]
        this.queue.push(pkt)
      } else {
        console.log(`[v${this.id}] cannot find next hop for dst ${pkt.e2e_dst}}`)
      }
    }
  }
}
