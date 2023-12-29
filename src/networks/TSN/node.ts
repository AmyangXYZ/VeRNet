import {
  type Packet,
  type Message,
  type MsgHandler,
  type PktHandler,
  ADDR,
  MSG_TYPE,
  type ASN_MSG_PAYLOAD
} from '../common'
import { TSN_PKT_TYPE, type TSN_INIT_MSG_PAYLOAD } from './typedefs'

class TSNNode {
  id: number = 0
  ASN: number = 0
  ports: { [p: number]: number } = {}
  msgHandlers: { [type: number]: MsgHandler } = {}
  pktHandlers: { [type: number]: PktHandler } = {}

  constructor() {
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)

    this.registerPktHandler(TSN_PKT_TYPE.DATA, this.dataPktHandler)
  }
  registerMsgHandler(type: number, handler: MsgHandler) {
    this.msgHandlers[type] = handler
  }
  registerPktHandler(type: number, handler: PktHandler) {
    this.pktHandlers[type] = handler
  }

  run() {
    onmessage = (e: any) => {
      if ('uid' in e.data == false) {
        const msg: Message = e.data
        if (this.msgHandlers[msg.type] != undefined) {
          this.msgHandlers[msg.type](msg)
        } else {
          // console.log('!! undefined message type:', msg.type)
        }
      } else {
        const pkt: Packet = e.data

        if (this.pktHandlers[pkt.type] != undefined) {
          this.pktHandlers[pkt.type](pkt)
        } else {
          // console.log('!! undefined packet type:', pkt.type)
        }
      }
    }
  }

  initMsgHandler = (msg: Message) => {
    const payload: TSN_INIT_MSG_PAYLOAD = msg.payload
    this.id = payload.id
  }
  asnMsgHandler = (msg: Message) => {
    const payload: ASN_MSG_PAYLOAD = msg.payload
    this.ASN = payload.asn

    // this.checkSchTx()

    // done
    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
    postMessage(<Message>{
      type: MSG_TYPE.STAT,
      src: this.id,
      dst: ADDR.CONTROLLER,
      payload: JSON.parse(JSON.stringify(this))
    })
  }
  dataPktHandler = (pkt: Packet) => {
    console.log('tsn', pkt)
  }
}

new TSNNode().run()
