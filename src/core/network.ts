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
  PROTOCOL_TYPE,
  type RoutingGraph,
  type RoutingMsgPayload,
  type FlowMsgPayload,
  type StatsSubscribePayload
} from './typedefs'
import { SeededRandom } from '@/utils/rand'
import type { NodeStats } from './typedefs/stats'

export class NetworkHub {
  Config: Ref<Config>
  Nodes: Ref<Node[]>
  Links = ref<{ [uid: number]: Link }>({})
  Flows = ref<Flow[]>([])
  Packets = ref<Packet[]>([])
  PacketsCurrent = ref<Packet[]>([])
  Logs = ref<string[]>([])
  ASN = ref<number>(0) // absolute slot number
  Rand: SeededRandom
  RoutingGraph = ref<RoutingGraph>()

  // to find nearest neighbors, only network devices are inserted in KDTrees
  kdTreeAny: KDTree // any network devices
  kdTreeTSCH: KDTree // TSCH only
  kdTreeTSN: KDTree // TSN only
  kdTreeFiveGgNB: KDTree // 5G gNB only

  PresetTopos: { [name: string]: any } = {}
  SelectedTopo = ref('5G-TSN-TSCH') // realistic topo example
  // SelectedTopo = ref('Routing test') // realistic topo example

  StatsPublisherNode = ref(0)
  NodeStats = ref<NodeStats | undefined>(undefined) // stats from the publisher node

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
    this.kdTreeAny = new KDTree()
    this.kdTreeTSCH = new KDTree()
    this.kdTreeTSN = new KDTree()
    this.kdTreeFiveGgNB = new KDTree()

    // load preset topologies
    const topos = import.meta.glob('@/topologies/*.json')
    for (const path in topos) {
      const name = path.split('/')[3].replace('.json', '')
      this.PresetTopos[name] = {} // placeholder before fully load json files
      topos[path]().then((f: any) => {
        this.PresetTopos[name] = f.default
      })
    }

    watch(this.SelectedTopo, () => {
      this.LoadTopology()
    })

    watch(this.StatsPublisherNode, (newN, oldN) => {
      if (oldN > 0 && this.Nodes.value[oldN] != undefined) {
        this.Nodes.value[oldN].w!.postMessage(<Message>{
          type: MSG_TYPE.STATS_SUBSCRIBE,
          payload: <StatsSubscribePayload>{ flag: false }
        })
      }
      if (this.Nodes.value[newN] != undefined) {
        this.Nodes.value[newN].w!.postMessage(<Message>{
          type: MSG_TYPE.STATS_SUBSCRIBE,
          payload: <StatsSubscribePayload>{ flag: true }
        })
      }
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
      case MSG_TYPE.STATS_REPORT:
        this.NodeStats.value = msg.payload
        break
    }
  }

  // forward physical layer pkt from each node
  handlePkt = (pkt: Packet) => {
    // check protocol type
    if (this.Nodes.value[pkt.mac_src].type == NODE_TYPE.TSCH || this.Nodes.value[pkt.mac_dst].type == NODE_TYPE.TSCH) {
      pkt.protocol = PROTOCOL_TYPE.TSCH
    }
    if (this.Nodes.value[pkt.mac_src].type == NODE_TYPE.TSN || this.Nodes.value[pkt.mac_dst].type == NODE_TYPE.TSN) {
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
    pkt.asn = this.ASN.value
    if (isValid) {
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
    this.Links.value = {}
  }
  LoadTopology() {
    this.Running.value = false
    clearInterval(this.asnTimer)
    this.Links.value = {}
    this.Packets.value = []
    this.PacketsCurrent.value = []
    this.ASN.value = 0
    this.clearNodes()

    if (this.SelectedTopo.value == 'Random') {
      for (let i = 1; i <= this.Config.value.num_nodes; i++) {
        const n = <Node>{
          id: this.Nodes.value.length,
          // type: [0, 1, 2, 3, 11, 12, 13, 14, 15, 16, 17][
          //   Math.floor((this.Rand.next() * Object.keys(NODE_TYPE).length) / 2)
          // ],
          type: [0, 1, 2, 3, 11, 12, 16][Math.floor(this.Rand.next() * 7)],
          pos: [
            Math.floor(this.Rand.next() * this.Config.value.grid_size) - this.Config.value.grid_size / 2,
            Math.floor(this.Rand.next() * this.Config.value.grid_size) - this.Config.value.grid_size / 2
          ],
          neighbors: [],
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
          pos: n.pos,
          neighbors: <number[]>[]
        })
      }
    }

    this.Logs.value.unshift(`Loaded topology: {${this.SelectedTopo.value}}.`)
  }

  EstablishConnection() {
    this.kdTreeAny = new KDTree()
    this.kdTreeTSCH = new KDTree()
    this.kdTreeTSN = new KDTree()
    this.kdTreeFiveGgNB = new KDTree()
    this.Links.value = {}
    for (const n of this.Nodes.value) {
      if (n.id == 0 || n.type > 10) continue
      this.kdTreeAny.Insert(new KDNode(n.id, n.pos))
      switch (n.type) {
        case NODE_TYPE.TSCH:
          this.kdTreeTSCH.Insert(new KDNode(n.id, n.pos))
          break
        case NODE_TYPE.TSN:
          this.kdTreeTSN.Insert(new KDNode(n.id, n.pos))
          break
        case NODE_TYPE.FIVE_G_GNB:
          this.kdTreeFiveGgNB.Insert(new KDNode(n.id, n.pos))
          break
        default:
          break
      }
    }

    for (const n of this.Nodes.value) {
      if (n.id == 0) continue

      let neighbors: any = []

      // actively find connections, final routing table will be based on the
      // overall connected graph (Links), not just the neighbors of each node
      switch (n.type) {
        // 5G UE connects to one 5G tower
        case NODE_TYPE.FIVE_G_UE: {
          neighbors = this.kdTreeFiveGgNB.FindKNearest(n.pos, 1, this.Config.value.tx_range)
          break
        }
        // 5G GNB connects to TSN bridges
        case NODE_TYPE.FIVE_G_GNB: {
          neighbors = this.kdTreeTSN.FindKNearest(n.pos, 2, this.Config.value.grid_size)
          break
        }
        // TSCH node connects to multiple other TSCH nodes and one TSN bridge
        case NODE_TYPE.TSCH: {
          neighbors = this.kdTreeTSCH.FindKNearest(n.pos, 1000, this.Config.value.tx_range)
          neighbors.push(...this.kdTreeTSN.FindKNearest(n.pos, 1, 12))
          break
        }
        // TSN bridge connects multiple TSN bridges
        case NODE_TYPE.TSN: {
          neighbors = this.kdTreeTSN.FindKNearest(n.pos, 1000, this.Config.value.tx_range)
          break
        }
        // end system connects to one network node
        default: {
          neighbors = this.kdTreeAny.FindKNearest(n.pos, 1, this.Config.value.grid_size)
          break
        }
      }
      neighbors.forEach((nn: number) => {
        this.AddLink(n.id, nn)
        if (n.neighbors.indexOf(nn) == -1) {
          n.neighbors.push(nn)
        }
        if (this.Nodes.value[nn].neighbors.indexOf(n.id) == -1) {
          this.Nodes.value[nn].neighbors.push(n.id)
        }
      })
    }

    this.Logs.value.unshift(`Established ${Object.keys(this.Links.value).length} links.`)
  }

  connect(v1: number, v2: number) {
    const node1 = this.Nodes.value.find((n) => n.id == v1)
    const node2 = this.Nodes.value.find((n) => n.id == v2)
    if (!node1 || !node2) {
      console.error('Connection error: node(s) not found.')
      return
    }

    this.AddLink(v1, v2)

    node1.neighbors.push(v2)
    node2.neighbors.push(v1)

    this.Logs.value.unshift(`Connected nodes ${v1} and ${v2}`)
  }

  StartWebWorkers() {
    for (const n of this.Nodes.value) {
      if (n.id == 0) continue
      if (n.w != undefined) {
        n.w.terminate()
      }

      switch (n.type) {
        case NODE_TYPE.TSCH:
          n.w = new Worker(new URL('@/core/nodes/tsch.ts', import.meta.url), { type: 'module' })
          break
        case NODE_TYPE.TSN:
          n.w = new Worker(new URL('@/core/nodes/tsn.ts', import.meta.url), { type: 'module' })
          break
        case NODE_TYPE.FIVE_G_GNB:
          n.w = new Worker(new URL('@/core/nodes/five_g_gnb.ts', import.meta.url), {
            type: 'module'
          })
          break
        case NODE_TYPE.FIVE_G_UE:
          n.w = new Worker(new URL('@/core/nodes/five_g_ue.ts', import.meta.url), { type: 'module' })
          break
        default:
          n.w = new Worker(new URL('@/core/nodes/end_system.ts', import.meta.url), {
            type: 'module'
          })
          break
      }

      n.w.postMessage(<Message>{
        type: MSG_TYPE.INIT,
        payload: <InitMsgPayload>{ id: n.id, neighbors: toRaw(n.neighbors) }
      })

      const routingTable: RoutingMsgPayload = {}
      const endSystems: Node[] = this.Nodes.value.filter((n) => n.type >= 11)
      for (const s of endSystems) {
        const path = this.findPath(n.id, s.id)
        if (path.length > 1) {
          routingTable[s.id] = path[1]
        }
      }
      n.w.postMessage(<Message>{
        type: MSG_TYPE.ROUTING,
        payload: toRaw(routingTable)
      })

      if (n.type >= 11) {
        const flows = toRaw(this.Flows.value).filter((f: Flow) => f.e2e_src == n.id)
        if (flows.length > 0) {
          n.w.postMessage(<Message>{
            type: MSG_TYPE.FLOW,
            payload: <FlowMsgPayload>{ flows: flows }
          })
        }
      }

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
        Math.floor(this.Rand.next() * this.Config.value.grid_size) - this.Config.value.grid_size / 2,
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
      this.Nodes.value[v1].type >= 10 || // is an end system
      this.Nodes.value[v2].type == NODE_TYPE.TSN ||
      this.Nodes.value[v2].type >= 10
    ) {
      type = LINK_TYPE.WIRED
    }

    if (this.Links.value[uid] == undefined) {
      this.Links.value[uid] = <Link>{ uid, v1, v2, type }
    }
  }

  ConstructRoutingGraph() {
    const graph: RoutingGraph = {}

    for (const link of Object.values(this.Links.value)) {
      if (link === undefined) continue

      const v1 = link.v1
      const v2 = link.v2

      if (graph[v1]) {
        graph[v1].push(v2)
      } else {
        graph[v1] = [v2]
      }

      if (graph[v2]) {
        graph[v2].push(v1)
      } else {
        graph[v2] = [v1]
      }
    }

    this.RoutingGraph.value = graph
  }

  findPath(srcId: number, dstId: number) {
    // Dijkstra's shortest path algorithm
    const graph = this.RoutingGraph.value || {} // null check
    const distances: { [nodeId: number]: number } = {}
    const previous: { [nodeId: number]: number | null } = {}

    // initialize distance and previous
    for (const nodeId in graph) {
      distances[nodeId] = parseInt(nodeId) === srcId ? 0 : Infinity
      previous[nodeId] = null
    }

    const unvisited = Object.keys(graph).map((id) => parseInt(id))

    while (unvisited.length > 0) {
      // node w/ smallest distance
      let smallest = 0
      for (let i = 1; i < unvisited.length; i++) {
        if (distances[unvisited[i]] < distances[unvisited[smallest]]) {
          smallest = i
        }
      }
      const current = unvisited[smallest]

      // mark visited
      unvisited.splice(smallest, 1)

      // update distances of neighbors
      for (const neighbor of graph[current]) {
        const alt = distances[current] + 1
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt
          previous[neighbor] = current
        }
      }
    }

    // construct path from previous
    const pathIds: number[] = []
    let current: number | null = dstId
    while (current != null) {
      pathIds.unshift(current)
      current = previous[current]
    }

    return pathIds
  }

  AddFlows(num_flows: number) {
    const endSystems = this.Nodes.value.filter((n) => n.type >= 11)

    for (let i = 0; i < num_flows; i++) {
      const src = endSystems[Math.floor(this.Rand.next() * endSystems.length)]

      let dst = src
      while (dst.id === src.id) {
        dst = endSystems[Math.floor(this.Rand.next() * endSystems.length)]
      }

      const f = <Flow>{
        id: this.Flows.value.length,
        e2e_src: src.id,
        e2e_dst: dst.id,
        period: Math.floor(this.Rand.next() * 4 + 1) * 5, // from 5 to 10 - change this later
        deadline: Math.floor(this.Rand.next() * 4 + 1) * 5, // from 5 to 10 - change this later
        workload: Math.floor(this.Rand.next() * 10) + 1, // from 1 to 10 - change this later
        path: this.findPath(src.id, dst.id),
        editing: false
      }
      this.Flows.value.push(f)
    }
    this.Logs.value.unshift(`Generated ${this.Flows.value.length} flows.`)
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
