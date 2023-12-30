import { type Message, type MsgHandler, type Packet, type PktHandler } from './typedefs'

export class Node {
  id: number = 0
  pkt_seq: number = 0
  tx_cnt: number = 0
  rx_cnt: number = 0
  ASN: number = 0

  msgHandlers: { [type: number]: MsgHandler } = {}
  pktHandlers: { [type: number]: PktHandler } = {}

  constructor() {}

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
}
