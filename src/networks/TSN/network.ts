import { ref, toRaw } from 'vue'
import {
  Network,
  NETWORK_TYPE,
  NODE_TYPE,
  type Message,
  LINK_TYPE,
  MSG_TYPE,
  type NodeMeta,
  type INIT_MSG_PAYLOAD,
  type Packet
} from '../common'
import { type ScheduleConfig, type TSNNodeMeta, type TSN_INIT_MSG_PAYLOAD } from './typedefs'
import { KDNode } from '../../utils/kdtree'

export class TSNNetwork extends Network {
  InPorts: any
  OutPorts: any

  constructor() {
    super()
    this.Type = NETWORK_TYPE.TSN
    // this.Schedule = ref<Cell[][]>([])
    this.SchConfig = ref<ScheduleConfig>({
      num_slots: 40
    })
    this.createNodes()
    this.createEndSystems()
  }
  createNodes = () => {
    this.NetworkDevices = ref<TSNNodeMeta[]>([])

    // clear old nodes and webworkers
    if (this.Nodes.value.length > 1) {
      for (const n of this.Nodes.value) {
        if (n.w != undefined) {
          n.w.terminate()
        }
      }
    }
    this.Nodes.value = [
      <TSNNodeMeta>{
        id: 0,
        type: NODE_TYPE.TSN,
        pos: [0, 0],
        neighbors: [],
        queueLen: 0,
        tx_cnt: 0,
        rx_cnt: 0,
        w: undefined
      }
    ] // placeholder

    for (let i = 1; i <= this.TopoConfig.value.num_nodes; i++) {
      const n = <TSNNodeMeta>{
        id: i,
        type: NODE_TYPE.TSN,
        pos: [
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2,
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2
        ],
        neighbors: [],
        tx_cnt: 0,
        rx_cnt: 0,
        w: new Worker(new URL('@/networks/TSN/node.ts', import.meta.url), { type: 'module' })
      }
      // send init msg
      n.w!.postMessage(<Message>{
        type: MSG_TYPE.INIT,
        payload: <TSN_INIT_MSG_PAYLOAD>{
          id: n.id,
          pos: toRaw(n.pos),
          neighbors: [],
          sch_config: toRaw(this.SchConfig.value)
        }
      })

      this.NetworkDevices.value.push(n)
      this.Nodes.value.push(n)
      this.KDTree.Insert(new KDNode(i, n.pos))
    }

    for (let i = 1; i <= this.TopoConfig.value.num_nodes; i++) {
      this.Nodes.value[i].neighbors = this.KDTree.FindKNearest(
        this.Nodes.value[i].pos,
        3,
        this.TopoConfig.value.tx_range
      )
      this.Nodes.value[i].neighbors.forEach((n: number) => {
        super.addLink(i, n, LINK_TYPE.WIRED)
      })
    }
  }
  createEndSystems = () => {
    // initialize ref array if it does not already exist
    this.EndSystems = ref<NodeMeta[]>([])

    for (
      let i = 1 + this.TopoConfig.value.num_nodes;
      i <= this.TopoConfig.value.num_es + this.TopoConfig.value.num_nodes;
      i++
    ) {
      const es = <NodeMeta>{
        id: i,
        type: Math.floor(4 + this.Rand.next() * 3),
        pos: [
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2,
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2
        ],
        tx_cnt: 0,
        rx_cnt: 0,
        neighbors: [],
        w: new Worker(new URL('@/networks/es.ts', import.meta.url), { type: 'module' })
      }
      console.log(i)
      es.neighbors = this.KDTree.FindKNearest(es.pos, 1, this.TopoConfig.value.grid_size)
      if (es.neighbors.length > 0) {
        this.addLink(es.id, es.neighbors[0], LINK_TYPE.WIRED)
      }

      es.w!.postMessage(<Message>{
        type: MSG_TYPE.INIT,
        payload: <INIT_MSG_PAYLOAD>{
          id: es.id,
          pos: toRaw(es.pos)
        }
      })
      // handle msg/pkt from end systems
      es.w!.onmessage = (e: any) => {
        if ('uid' in e.data == false) {
          const msg: Message = e.data
          console.log(msg)
        } else {
          const pkt: Packet = e.data
          this.Nodes.value[pkt.mac_dst].w!.postMessage(pkt)
          this.Packets.value.push(pkt)
          this.PacketsCurrent.value.push(pkt)
          this.SlotDone.value = true
        }
      }

      this.EndSystems.value.push(es)
      this.Nodes.value.push(es)
    }
  }
}
