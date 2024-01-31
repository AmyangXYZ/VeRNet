import { Node } from '../node'
import {
  PKT_TYPE,
  type Message,
  type Packet,
  MSG_TYPE,
  type ASNMsgPayload,
  type InitMsgPayload,
  type FlowMsgPayload,
  type Flow,
  type RoutingMsgPayload
} from '../typedefs'

class EndSystem extends Node {
  flows: Flow[] = []
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
    this.registerMsgHandler(MSG_TYPE.FLOW, this.flowMsgHandler)
    this.registerMsgHandler(MSG_TYPE.ROUTING, this.routingMsgHandler)

    this.registerPktHandler(PKT_TYPE.DATA, this.dataPktHandler)
  }
  initMsgHandler = (msg: Message) => {
    const payload: InitMsgPayload = msg.payload
    this.id = payload.id
    this.neighbors = payload.neighbors
  }
  asnMsgHandler = (msg: Message) => {
    const payload: ASNMsgPayload = msg.payload
    this.ASN = payload.asn

    // do something
    for (const flow of this.flows) {
      if (this.ASN % flow.period == 1) {
        this.queue.push(<Packet>{
          uid: Math.floor(Math.random() * 0xffff),
          type: PKT_TYPE.DATA,
          e2e_src: this.id,
          e2e_dst: flow.e2e_dst,
          mac_src: this.id,
          mac_dst: this.routingTable[flow.e2e_dst],
          len: flow.workload,
          payload: 'biubiubiu'
        })
      }
    }

    if (this.queue.length > 0) {
      const pkt = this.queue.pop()
      postMessage(pkt)
    }

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
  flowMsgHandler = (msg: Message) => {
    const payload: FlowMsgPayload = msg.payload
    this.flows = payload.flows
  }
  routingMsgHandler = (msg: Message) => {
    const payload: RoutingMsgPayload = msg.payload
    this.routingTable = payload
  }
  dataPktHandler = (pkt: Packet) => {
    // console.log('received', pkt)
  }
}

new EndSystem().Run()
