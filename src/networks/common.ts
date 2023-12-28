import { ref, type Ref } from 'vue'
import { SeededRandom } from '@/hooks/useSeed'
import { KDTree } from './TSN/kdtree'

export enum NETWORK_TYPE {
  TSCH,
  TSN,
  FiveG
}

export enum NODE_TYPE {
  TSCH,
  TSN,
  FIVE_G_BS,
  FIVE_G_UE
}

export enum END_SYSTEM_TYPE {
  Server,
  RoboticArm,
  Sensor
  // add more and find the corresponding 3D models
}

export interface NodeMeta {
  id: number
  type: number
  pos: [number, number]
  neighbors: number[]
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}

export interface LinkMeta {
  // undirected link for visualization
  uid: number
  v1: number
  v2: number
  type: number
}

export enum LINK_TYPE {
  WIRED,
  WIRELESS
}

// Packet is transfered among nodes, at data-link layer
export interface Packet {
  uid: number
  type: number
  ch: number
  src: number
  dst: number
  seq: number
  asn: number
  len: number
  payload: any

  // for display on packet sniffer
  id: number
  children: any
}

// Message is used for direct communication (debug, cmd, stats) between nodes and controller
export interface Message {
  type: number
  src: number
  dst: number
  payload: any
}

export type MsgHandler = (msg: Message) => void
export type PktHandler = (pkt: Packet) => void

export interface TopologyConfig {
  seed: number
  num_nodes: number
  num_es: number
  grid_size: number
  tx_range: number
}

export class Network {
  ID: number
  Type: number
  Nodes: any // tsn bridges, tsch node or 5g ue/bs
  EndSystems: any
  Links = ref<{ [uid: number]: LinkMeta }>([])
  TopoConfig: Ref<TopologyConfig>
  KDTree: KDTree
  SchConfig: any
  Schedule: any
  Packets = ref<Packet[]>([])
  ASN = ref(0)
  asnTimer: any
  PacketsCurrent = ref<Packet[]>([])

  SignalReset = ref(0)
  SlotDone = ref(true)
  Running = ref(false)
  SlotDuration = ref(750)

  Rand: SeededRandom

  constructor() {
    this.ID = 1
    this.Type = -1
    this.TopoConfig = ref<TopologyConfig>({
      seed: 1,
      num_nodes: 10,
      num_es: 4,
      grid_size: 80,
      tx_range: 25
    })
    this.Rand = new SeededRandom(this.TopoConfig.value.seed)
    this.KDTree = new KDTree()
  }
  // call after create nodes
  createEndSystems() {
    // initialize ref array if it does not already exist
    this.EndSystems = ref<NodeMeta[]>([])

    this.EndSystems.value = [] // clear any old end systems

    for (let i = 1; i <= this.TopoConfig.value.num_es; i++) {
      const es = <NodeMeta>{
        id: i + this.TopoConfig.value.num_nodes,
        type: Math.floor(
          this.Rand.next() * Object.keys(END_SYSTEM_TYPE).filter((key) => isNaN(Number(key))).length
        ), // Object.keys(...).filter(...) is used to count # of elements in enum
        pos: [
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2,
          Math.floor(this.Rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2
        ],
        tx_cnt: 0,
        rx_cnt: 0,
        neighbors: [],
        w: undefined
      }
      es.neighbors = this.KDTree.FindKNearest(es.pos, 1, this.TopoConfig.value.grid_size)
      if (es.neighbors.length > 0) {
        this.addLink(es.id, es.neighbors[0], LINK_TYPE.WIRED)
      }
      this.EndSystems.value.push(es)
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
