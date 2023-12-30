import { Node } from './node'
import { PKT_TYPE, type Message, type Packet, MSG_TYPE, type ASNMsgPayload } from './typedefs'

class FiveGBS extends Node {
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
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
  dataPktHandler = (pkt: Packet) => {
    // console.log('tsn', pkt)
  }
}

new FiveGBS().Run()
