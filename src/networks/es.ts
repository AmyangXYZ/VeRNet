import { MSG_TYPE, type Message, type MsgHandler, type Packet, type PktHandler } from './common'

// end system, run as a webworker
class EndSystem {
  id: number = 0
  neighbor: number = -1

  msgHandlers: { [type: number]: MsgHandler } = {}
  pktHandlers: { [type: number]: PktHandler } = {}

  constructor() {
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
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
          // test
          postMessage(<Packet>{
            uid: 11,
            type: 0,
            mac_src: 11,
            mac_dst: 3
          })
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
  initMsgHandler = () => {}
  dataMsgHandler = () => {}
}

new EndSystem().run()
