import { Node } from './node'
import { PKT_TYPE, type Message, type Packet, MSG_TYPE, type ASNMsgPayload, type InitMsgPayload } from './typedefs'

class TSCHNode extends Node {
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
    this.registerPktHandler(PKT_TYPE.DATA, this.dataPktHandler)
  }
  asnMsgHandler = (msg: Message) => {
    const payload: ASNMsgPayload = msg.payload
    this.ASN = payload.asn

    // do something

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
  initMsgHandler = (msg: Message) => {
    const payload: InitMsgPayload = msg.payload
    this.id = payload.id
    this.neighbors = payload.neighbors
  }
  dataPktHandler = (pkt: Packet) => {
    // console.log(this.id, 'tsch', pkt)
  }
}

new TSCHNode().Run()
