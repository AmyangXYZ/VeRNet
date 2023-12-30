import { ref, toRaw, type Ref } from 'vue'
import { SeededRandom } from '@/hooks/useSeed'
import { KDTree } from './kdtree'
import {
  LINK_TYPE,
  MSG_TYPE,
  type LinkMeta,
  type Message,
  type NodeMeta,
  type Packet,
  type TopologyConfig,
  type INIT_MSG_PAYLOAD,
  type FlowMeta
} from './common'

export class Network {
  ID: number
  Type: number
  Nodes = ref<NodeMeta[]>([]) // nodes and endsystems, for visualization
  NetworkDevices: any // tsn bridges, tsch relay or 5g ue/bs
  EndSystems = ref<NodeMeta[]>([])
  Links = ref<{ [uid: number]: LinkMeta }>([])
  Flows = ref<FlowMeta[]>([])
  TopoConfig: Ref<TopologyConfig>
  KDTree: KDTree
  SchConfig: any
  Schedule: any
  Packets = ref<Packet[]>([])
  ASN = ref(0)
  asnTimer: any
  PacketsCurrent = ref<Packet[]>([])

  SignalReset = ref(0)
  SlotDone = ref(false)
  Running = ref(false)
  SlotDuration = ref(750)

  Rand: SeededRandom

  constructor() {
    this.ID = 1
    this.Type = -1
    this.TopoConfig = ref<TopologyConfig>({
      seed: 1,
      num_nodes: 10,
      num_es: 1,
      grid_size: 80,
      tx_range: 25
    })
    this.Rand = new SeededRandom(this.TopoConfig.value.seed)
    this.Nodes.value.push(<NodeMeta>{})
    this.KDTree = new KDTree()
  }
  // call after createNodes
  createEndSystems() {
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
  addLink(v1: number, v2: number, type: number) {
    if (v1 > v2) {
      ;[v1, v2] = [v2, v1]
    }
    // Cantor pairing
    const uid = 0.5 * (v1 + v2) * (v1 + v2 + 1) + v2
    if (this.Links.value[uid] == undefined) {
      this.Links.value[uid] = <LinkMeta>{ uid, v1, v2, type }
    }
  }

  Run = () => {
    this.Step()
    this.Running.value = true
    this.asnTimer = setInterval(() => {
      this.ASN.value++
      this.SlotDone.value = false
    }, this.SlotDuration.value)
  }
  Step = () => {
    this.ASN.value++
    this.SlotDone.value = false
  }
  Pause = () => {
    this.Running.value = false
    clearInterval(this.asnTimer)
  }
  Reset = () => {
    this.Running.value = false
    clearInterval(this.asnTimer)
    this.SignalReset.value++
  }
}
