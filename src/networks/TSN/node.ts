import type { INIT_MSG_PAYLOAD } from '../TSCH/typedefs'
import type { Packet, Message, MsgHandler, PktHandler } from '../common'

class TSNNode {
  id: number = 0
  ports: { [p: number]: number } = {}
  msgHandlers: { [type: number]: MsgHandler } = {}
  pktHandlers: { [type: number]: PktHandler } = {}
  constructor() {}
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
          console.log('!! undefined message type:', msg.type)
        }
      } else {
        const pkt: Packet = e.data

        if (this.pktHandlers[pkt.type] != undefined) {
          this.pktHandlers[pkt.type](pkt)
        } else {
          console.log('!! undefined packet type:', pkt.type)
        }
      }
    }
  }

  initMsgHandler = (msg: Message) => {
    const payload: INIT_MSG_PAYLOAD = msg.payload
    this.id = payload.id
    console.log(this.id)
  }
  dataPktHandler = (pkt: Packet) => {
    console.log(pkt)
  }
}

new TSNNode().run()
