import { ref, toRaw } from 'vue'
import {  NETWORK_TYPE, NODE_TYPE, type Message, LINK_TYPE, MSG_TYPE } from '../common'
import { type ScheduleConfig, type TSNNodeMeta, type TSN_INIT_MSG_PAYLOAD } from './typedefs'
import { KDNode } from '../kdtree'
import { Network } from '../network'

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
    super.createEndSystems()
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
}
