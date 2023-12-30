import { Node } from './node'
import { PKT_TYPE, type Message, type Packet, MSG_TYPE, type ASNMsgPayload } from './typedefs'

class FiveGUE extends Node {
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
  }
  asnMsgHandler = (msg: Message) => {
    const payload: ASNMsgPayload = msg.payload
    this.ASN = payload.asn

    // do something
    postMessage(<Packet>{
      uid: 11,
      type: PKT_TYPE.DATA,
      mac_src: 12,
      mac_dst: 2
    })

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
}
new FiveGUE().Run()
