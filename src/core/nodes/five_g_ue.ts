import { Node } from './node'
import {
  PKT_TYPE,
  type Message,
  type Packet,
  MSG_TYPE,
  type ASNMsgPayload,
  type InitMsgPayload,
  type RoutingMsgPayload
} from '../typedefs'

class FiveGUE extends Node {
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
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
    if (this.queue.length > 0) {
      const pkt = this.queue.pop()
      postMessage(pkt)
    }

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
  routingMsgHandler = (msg: Message) => {
    const payload: RoutingMsgPayload = msg.payload
    this.routingTable = payload
  }
  dataPktHandler = (pkt: Packet) => {
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
new FiveGUE().Run()
