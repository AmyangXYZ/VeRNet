import { ref, type Ref, watch, toRaw } from 'vue'
import { KDNode, KDTree } from '@/utils/kdtree'
import {
  NODE_TYPE,
  type Config,
  type Flow,
  type Link,
  type Node,
  type Packet,
  type Message,
  MSG_TYPE,
  type ASNMsgPayload,
  LINK_TYPE,
  type InitMsgPayload,
  PROTOCOL_TYPE
} from './typedefs'
import { SeededRandom } from '@/utils/rand'

import presetTopos from './preset_topologies.json'

export class NetworkHub {
  Config: Ref<Config>
  Nodes: Ref<Node[]>
  Links = ref<Link[]>([])
  Flows = ref<Flow[]>([])
  Packets = ref<Packet[]>([])
  PacketsCurrent = ref<Packet[]>([])
  Logs = ref<string[]>([])
  ASN = ref<number>(0) // absolute slot number
  Rand: SeededRandom
  kdTree: KDTree // to find nearest neighbors

  PresetTopos: { [name: string]: any } = presetTopos
  SelectedTopo = ref('5G single-cell')

  asnTimer: any
  SignalReset = ref(0)
  SlotDone = ref(false)
  doneCnt: number = 0
  Running = ref(false)
  SlotDuration = ref(750)

  constructor(config: Config) {
    this.Config = ref<Config>(config)
    this.Nodes = ref<Node[]>([<Node>{ id: 0 }]) // placeholder to let node_id start from 1
    this.Rand = new SeededRandom(this.Config.value.seed)
    this.kdTree = new KDTree()

    watch(this.SelectedTopo, () => {
      this.LoadTopology()
    })

    watch(this.ASN, () => {
      if (this.ASN.value > 0) {
        this.doneCnt = 0
        this.PacketsCurrent.value = []

        if (this.Nodes.value.length > 1) {
          for (const n of this.Nodes.value) {
            if (n.w != undefined) {
              n.w.postMessage(<Packet>{
                type: MSG_TYPE.ASN,
                id: n.id,
                payload: <ASNMsgPayload>{ asn: this.ASN.value }
              })
            }
          }
        }
      }
    })
  }

  // handle control plane msg from each node
  handleMsg = (msg: Message) => {
    switch (msg.type) {
      case MSG_TYPE.DONE:
        if (++this.doneCnt == this.Nodes.value.length - 1) {
          this.SlotDone.value = true
        }
        break
      case MSG_TYPE.STAT:
        break
    }
  }

  // forward physical layer pkt from each node
  handlePkt = (pkt: Packet) => {
    // check protocol type
    if (
      this.Nodes.value[pkt.mac_src].type == NODE_TYPE.TSCH ||
      this.Nodes.value[pkt.mac_dst].type == NODE_TYPE.TSCH
    ) {
      pkt.protocol = PROTOCOL_TYPE.TSCH
    }
    if (
      this.Nodes.value[pkt.mac_src].type == NODE_TYPE.TSN ||
      this.Nodes.value[pkt.mac_dst].type == NODE_TYPE.TSN
    ) {
      pkt.protocol = PROTOCOL_TYPE.TSN
    }
    if (
      this.Nodes.value[pkt.mac_src].type == NODE_TYPE.FIVE_G_GNB ||
      this.Nodes.value[pkt.mac_dst].type == NODE_TYPE.FIVE_G_GNB ||
      this.Nodes.value[pkt.mac_src].type == NODE_TYPE.FIVE_G_UE ||
      this.Nodes.value[pkt.mac_dst].type == NODE_TYPE.FIVE_G_UE
    ) {
      pkt.protocol = PROTOCOL_TYPE.FIVE_G
    }

    let isValid: boolean = false
    // To-do: validate packet and check interference
    switch (pkt.protocol) {
      case PROTOCOL_TYPE.TSN:
        isValid = true
        break
      case PROTOCOL_TYPE.TSCH:
        isValid = true
        break
      case PROTOCOL_TYPE.FIVE_G:
        isValid = true
        break
      default:
        isValid = true
    }

    if (isValid) {
      this.Nodes.value[pkt.mac_src].tx_cnt++
      this.Nodes.value[pkt.mac_dst].rx_cnt++
      this.Nodes.value[pkt.mac_dst].w!.postMessage(pkt)

      // must use this format for the detailedView function of el-table-v2
      pkt.id = this.Packets.value.length
      pkt.children = [
        {
          id: `${this.Packets.value.length}-detail-content`,
          detail: JSON.stringify(pkt.payload).replace(/"/g, '')
        }
      ]

      this.Packets.value.push(pkt)
      this.PacketsCurrent.value.push(pkt)
    }
  }
  clearNodes() {
    for (const n of this.Nodes.value) {
      if (n.id == 0) continue
      if (n.w != undefined) {
        n.w.terminate()
      }
    }
    this.Nodes.value = [<Node>{ id: 0 }] // placeholder to let node_id start from 1
    this.Links.value = []
  }
  LoadTopology() {
    this.Running.value = false
    clearInterval(this.asnTimer)
    this.Links.value = []
    this.Packets.value = []
    this.PacketsCurrent.value = []
    this.ASN.value = 0
    this.clearNodes()

    if (this.SelectedTopo.value == 'Random') {
      for (let i = 1; i <= this.Config.value.num_nodes; i++) {
        const n = <Node>{
          id: this.Nodes.value.length,
          type: [0, 1, 2, 3, 11, 12, 13][
            Math.floor((this.Rand.next() * Object.keys(NODE_TYPE).length) / 2)
          ],
          pos: [
            Math.floor(this.Rand.next() * this.Config.value.grid_size) -
              this.Config.value.grid_size / 2,
            Math.floor(this.Rand.next() * this.Config.value.grid_size) -
              this.Config.value.grid_size / 2
          ],
          neighbors: [],
          tx_cnt: 0,
          rx_cnt: 0,
          w: undefined
        }
        this.Nodes.value.push(n)
      }
    } else {
      const topo = this.PresetTopos[this.SelectedTopo.value]
      for (const n of topo.nodes) {
        this.Nodes.value.push(<Node>{
          id: n.id,
          type: n.type,
          pos: n.pos
        })
      }
    }

    this.Logs.value.unshift(`Loaded topology: {${this.SelectedTopo.value}}.`)
  }

  EstablishConnection() {
    this.kdTree = new KDTree()
    this.Links.value = []
    for (const n of this.Nodes.value) {
      if (n.id == 0 || n.type > 10) continue
      this.kdTree.Insert(new KDNode(n.id, n.pos))
    }

    for (const n of this.Nodes.value) {
      if (n.id == 0) continue

      if (n.type == NODE_TYPE.TSN || n.type == NODE_TYPE.TSCH) {
        n.neighbors = this.kdTree.FindKNearest(n.pos, 4, 20)
      } else {
        n.neighbors = this.kdTree.FindKNearest(n.pos, 1, this.Config.value.grid_size)
      }

      n.neighbors.forEach((nn: number) => {
        this.AddLink(n.id, nn)
      })
    }

    this.Logs.value.unshift(`Established ${Object.keys(this.Links.value).length} links.`)
  }

  StartWebWorkers() {
    for (const n of this.Nodes.value) {
      if (n.id == 0) continue
      if (n.w != undefined) {
        n.w.terminate()
      }

      switch (n.type) {
        case NODE_TYPE.TSCH:
          n.w = new Worker(new URL('@/core/node_tsch.ts', import.meta.url), { type: 'module' })
          break
        case NODE_TYPE.TSN:
          n.w = new Worker(new URL('@/core/node_tsn.ts', import.meta.url), { type: 'module' })
          break
        case NODE_TYPE.FIVE_G_GNB:
          n.w = new Worker(new URL('@/core/node_five_g_gnb.ts', import.meta.url), {
            type: 'module'
          })
          break
        case NODE_TYPE.FIVE_G_UE:
          n.w = new Worker(new URL('@/core/node_five_g_ue.ts', import.meta.url), { type: 'module' })
          break
        default:
          n.w = new Worker(new URL('@/core/node_end_system.ts', import.meta.url), {
            type: 'module'
          })
          break
      }

      n.w.postMessage(<Message>{
        type: MSG_TYPE.INIT,
        id: n.id,
        payload: <InitMsgPayload>{ id: n.id, neighbors: toRaw(n.neighbors) }
      })

      n.w.onmessage = (e: any) => {
        if ('uid' in e.data) {
          this.handlePkt(e.data)
        } else {
          this.handleMsg(e.data)
        }
      }
    }
    this.Logs.value.unshift('Started WebWorkers.')
  }

  AddNode(type: number) {
    const n = <Node>{
      id: this.Nodes.value.length,
      type: type,
      pos: [
        Math.floor(this.Rand.next() * this.Config.value.grid_size) -
          this.Config.value.grid_size / 2,
        Math.floor(this.Rand.next() * this.Config.value.grid_size) - this.Config.value.grid_size / 2
      ],
      neighbors: [],
      tx_cnt: 0,
      rx_cnt: 0,
      w: undefined
    }
    this.Nodes.value.push(n)

    this.Logs.value.unshift(`New ${NODE_TYPE[type]} node: ID:${n.id}, position-:[${n.pos}].`)
  }

  AddLink(v1: number, v2: number) {
    if (v1 > v2) {
      ;[v1, v2] = [v2, v1]
    }
    // Cantor pairing
    const uid = 0.5 * (v1 + v2) * (v1 + v2 + 1) + v2

    let type: number = LINK_TYPE.WIRELESS
    if (
      this.Nodes.value[v1].type == NODE_TYPE.TSN ||
      this.Nodes.value[v1].type >= 10 || // is a end system
      this.Nodes.value[v2].type == NODE_TYPE.TSN ||
      this.Nodes.value[v2].type >= 10
    ) {
      type = LINK_TYPE.WIRED
    }

    if (this.Links.value[uid] == undefined) {
      this.Links.value[uid] = <Link>{ uid, v1, v2, type }
    }
  }

  Run = () => {
    this.Logs.value.unshift('Emulation started.')
    this.ASN.value++
    this.SlotDone.value = false
    this.Running.value = true
    this.asnTimer = setInterval(() => {
      this.ASN.value++
      this.SlotDone.value = false
    }, this.SlotDuration.value)
  }
  Step = () => {
    this.Logs.value.unshift('ASN increased by one.')
    this.ASN.value++
    this.SlotDone.value = false
  }
  Pause = () => {
    this.Logs.value.unshift('Emulation paused.')
    this.Running.value = false
    clearInterval(this.asnTimer)
  }
  Reset = () => {
    this.Logs.value.unshift('Emulation reset.')
    this.Running.value = false
    clearInterval(this.asnTimer)
    this.SignalReset.value++
    this.Packets.value = []
    this.PacketsCurrent.value = []
    this.ASN.value = 0
  }
}
