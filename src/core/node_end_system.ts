import { Node } from './node'
import {
  PKT_TYPE,
  type Message,
  type Packet,
  MSG_TYPE,
  type ASNMsgPayload,
  type InitMsgPayload
} from './typedefs'

class EndSystem extends Node {
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
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
    if (this.ASN % 3 == this.id % 3) {
      postMessage(<Packet>{
        uid: Math.floor(Math.random() * 0xffff),
        type: PKT_TYPE.DATA,
        asn: this.ASN,
        e2e_src: this.id,
        mac_src: this.id,
        mac_dst: this.neighbors[0],
        len: 'biubiubiu'.length,
        payload: 'biubiubiu'
      })
    }

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
  dataPktHandler = (pkt: Packet) => {
    // console.log('tsn', pkt)
  }
}

new EndSystem().Run()
