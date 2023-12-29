import { ref } from 'vue'
import { LINK_TYPE,  NETWORK_TYPE, NODE_TYPE } from '../common'
import type { ScheduleConfig, FiveGNodeMeta } from './typedefs'
import { KDNode } from '../kdtree'
import { Network } from '../network'

export class FiveGNetwork extends Network {
  constructor() {
    super()
    this.Type = NETWORK_TYPE.FIVE_G
    // this.Schedule = ref<Cell[][]>([])
    this.SchConfig = ref<ScheduleConfig>({
      num_slots: 40
    })
    this.createNodes()
  }
  createNodes = () => {
    this.Nodes = ref<FiveGNodeMeta[]>([])

    // clear old nodes and webworkers
    if (this.Nodes.value.length > 1) {
      for (const n of this.Nodes.value) {
        if (n.w != undefined) {
          n.w.terminate()
        }
      }
    }
    this.Nodes.value = [
      <FiveGNodeMeta>{
        id: 0,
        type: NODE_TYPE.FIVE_G_BS,
        pos: [0, 0],
        neighbors: [],
        queueLen: 0,
        tx_cnt: 0,
        rx_cnt: 0,
        w: undefined
      }
    ]

    for (let i = 1; i <= this.TopoConfig.value.num_nodes; i++) {
      const n = <FiveGNodeMeta>{
        id: i,
        type: NODE_TYPE.FIVE_G_UE,
        pos: [
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2,
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2
        ],
        neighbors: [],
        tx_cnt: 0,
        rx_cnt: 0,
        w: new Worker(new URL('@/networks/5G/node.ts', import.meta.url), { type: 'module' })
      }
      this.KDTree.Insert(new KDNode(i, n.pos))

      // add links
      super.addLink(0, i, LINK_TYPE.WIRELESS)

      // send init msg
      // n.w!.postMessage(<Message>{
      //   type: MSG_TYPE.INIT,
      //   payload: <INIT_MSG_PAYLOAD>{
      //     id: n.id,
      //     pos: toRaw(n.pos),
      //     sch_config: toRaw(this.SchConfig.value)
      //   }
      // })
      // handle msg/pkt from nodes
      // n.w!.onmessage = (e: any) => {
      //   if ('uid' in e.data == false) {
      //     const msg: Message = e.data
      //     if (this.msgHandlers[msg.type] != undefined) {
      //       this.msgHandlers[msg.type](msg)
      //     } else {
      //       console.log('!! undefined message type:', msg.type)
      //     }
      //   } else {
      //     const pkt: Packet = e.data
      //     // check channel interference, only one packet can be transmitted on each channel in a slot
      //     if (
      //       this.PacketsCurrent.value.filter((p) => p.ch == pkt.ch).length == 0 ||
      //       pkt.type == PKT_TYPE.ACK
      //     ) {
      //       // must use this format for the detailedView function of el-table-v2
      //       pkt.id = this.Packets.value.length
      //       pkt.children = [
      //         {
      //           id: `${this.Packets.value.length}-detail-content`,
      //           detail: JSON.stringify(pkt.payload).replace(/"/g, '')
      //         }
      //       ]

      //       this.Packets.value.push(pkt)
      //       this.PacketsCurrent.value.push(pkt)

      //       if (pkt.dst == ADDR.BROADCAST) {
      //         for (const nn of this.Nodes.value) {
      //           // check if in tx_range
      //           const distance = Math.sqrt(
      //             Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
      //           )
      //           if (nn.id > 0 && nn.id != n.id && distance <= this.TopoConfig.value.tx_range) {
      //             nn.w!.postMessage(pkt)
      //           }
      //         }
      //       } else {
      //         const nn = this.Nodes.value[pkt.dst]
      //         if (nn != undefined) {
      //           // check if in tx_range
      //           const distance = Math.sqrt(
      //             Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
      //           )
      //           if (distance <= this.TopoConfig.value.tx_range) {
      //             nn.w!.postMessage(pkt)
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
      this.Nodes.value.push(n)
    }
  }
}
