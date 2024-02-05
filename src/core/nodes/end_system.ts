import { Node } from '../node'
import { PKT_TYPE, type Message, type Packet, MSG_TYPE, type FlowMsgPayload, type Flow } from '../typedefs'

class EndSystem extends Node {
  flows: Flow[] = []
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.FLOW, this.flowMsgHandler)
  }

  action = () => {
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
      this.tx_cnt++
    }
  }

  flowMsgHandler = (msg: Message) => {
    const payload: FlowMsgPayload = msg.payload
    this.flows = payload.flows
  }

  dataPktHandler = (pkt: Packet) => {
    console.log('received', pkt.uid)
    this.rx_cnt++
  }
}

new EndSystem().Run()
