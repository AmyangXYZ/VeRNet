import { ref, type Ref } from 'vue'
import { SeededRandom } from '@/hooks/useSeed'

export class Network {
  ID: number
  Type: number
  Nodes: any
  EndSystems: any
  TopoConfig: Ref<TopologyConfig>
  SchConfig: any
  Schedule: any
  Packets = ref<Packet[]>([])
  ASN = ref(0)
  asnTimer = 0
  PacketsCurrent = ref<Packet[]>([])

  SignalReset = ref(0)
  SlotDone = ref(true)
  Running = ref(false)
  SlotDuration = ref(1000)

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
    this.createEndSystems()
  }
  createEndSystems = () => {
    // initialize ref array if it does not already exist
    this.EndSystems = ref<EndSystemMeta[]>([]) 
    const rand = new SeededRandom(this.TopoConfig.value.seed)
    
    this.EndSystems.value = [] // clear any old end systems
    
    for (let i = 1; i <= this.TopoConfig.value.num_es; i++) {
      const es = {
        id: i,
        type: Math.floor(rand.next() * Object.keys(END_SYSTEM_TYPE).filter(key => isNaN(Number(key))).length), // Object.keys(...).filter(...) is used to count # of elements in enum
        pos: [
          Math.floor(rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2,
          Math.floor(rand.next() * this.TopoConfig.value.grid_size) -
            this.TopoConfig.value.grid_size / 2
        ],
        neighbor: 1 + Math.floor(rand.next() * this.TopoConfig.value.num_nodes) // range from 1 to num_nodes inclusive
      }

      this.EndSystems.value.push(es)
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

export enum NetworkType {
  TSCH,
  TSN,
  FiveG
}

export enum NODE_TYPE {
  TSCH,
  TSN,
  FiveGBS,
  FiveGUE,
  EndSystem
}

export interface NodeMeta {
  id: number
  type: number
  pos: number[]
  neighbors: number[]
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}

export enum END_SYSTEM_TYPE {
  Server,
  RoboticArm,
  Sensor
  // add more and find the corresponding 3D models
}

export interface EndSystemMeta {
  id: number
  type: number
  pos: number[]
  neighbor: number // an es only connects with one network node/switch/base-station
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

  // callback function when the packet is successfully tranmistted
  // (received ack)
  callback: () => void | undefined

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
