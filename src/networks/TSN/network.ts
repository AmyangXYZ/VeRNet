import { ref, toRaw } from 'vue'
import { Network, NETWORK_TYPE, NODE_TYPE, type Message, LINK_TYPE } from '../common'
import { MSG_TYPES, type INIT_MSG_PAYLOAD, type ScheduleConfig, type TSNNodeMeta } from './typedefs'
import { SeededRandom } from '@/hooks/useSeed'
import { KDNode, KDTree } from './kdtree'

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
  }
  createNodes = () => {
    this.Nodes = ref<TSNNodeMeta[]>([])
    const rand = new SeededRandom(this.TopoConfig.value.seed)

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

    // to find neighbors
    const tree = new KDTree()

    for (let i = 1; i <= this.TopoConfig.value.num_nodes; i++) {
      const n = <TSNNodeMeta>{
        id: i,
        type: NODE_TYPE.TSN,
        pos: [
          Math.floor(rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2,
          Math.floor(rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2
        ],
        neighbors: [],
        tx_cnt: 0,
        rx_cnt: 0,
        w: new Worker(new URL('@/networks/TSN/node.ts', import.meta.url), { type: 'module' })
      }
      // send init msg
      n.w!.postMessage(<Message>{
        type: MSG_TYPES.INIT,
        payload: <INIT_MSG_PAYLOAD>{
          id: n.id,
          pos: toRaw(n.pos),
          neighbors: [],
          sch_config: toRaw(this.SchConfig.value)
        }
      })

      this.Nodes.value.push(n)
      tree.Insert(new KDNode(i, this.Nodes.value[i].pos))
    }

    for (let i = 1; i <= this.TopoConfig.value.num_nodes; i++) {
      this.Nodes.value[i].neighbors = tree.FindKNearest(
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
