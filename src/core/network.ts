import { ref, type Ref, watch } from 'vue'
import { KDTree } from '@/utils/kdtree'
import {
  NODE_TYPE,
  type Config,
  type Flow,
  type Link,
  type Node,
  type Packet,
  type Message,
  MSG_TYPE,
  type ASNMsgPayload
} from './typedefs'
import { SeededRandom } from '@/utils/rand'

export class NetworkHub {
  Config: Ref<Config>
  Nodes: Ref<Node[]>
  Links = ref<Link[]>([])
  Flows = ref<Flow[]>([])
  Packets = ref<Packet[]>([])
  PacketsCurrent = ref<Packet[]>([])
  ASN = ref<number>(0) // absolute slot number
  Rand: SeededRandom
  KDTree = new KDTree() // to find nearest neighbors

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
    
    this.createNodes()

    watch(this.ASN, () => {
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
    })
  }

  createNodes() {
    for (let i = 1; i <= this.Config.value.num_nodes; i++) {
      const n = <Node>{
        id: i,
        type: Math.floor((this.Rand.next() * Object.values(NODE_TYPE).length) / 2),
        pos: [
          Math.floor(this.Rand.next() * this.Config.value.grid_size) -
            this.Config.value.grid_size / 2,
          Math.floor(this.Rand.next() * this.Config.value.grid_size) -
            this.Config.value.grid_size / 2
        ],
        neighbors: [],
        tx_cnt: 0,
        rx_cnt: 0,
        // w: new Worker(new URL('@/networks/TSN/node.ts', import.meta.url), { type: 'module' })
        w: undefined
      }

      const worker_path = `./node_${NODE_TYPE[n.type].toLowerCase()}.ts`
      n.w = new Worker(new URL(worker_path, import.meta.url), { type: 'module' })

      n!.w.onmessage = (e: any) => {
        if ('uid' in e.data) {
          this.handlePkt(e.data)
        } else {
          this.handleMsg(e.data)
        }
      }
      this.Nodes.value.push(n)
    }
  }

  AddNode(id: number, type: number) {
    const n = <Node>{ id: id, type: type }
    this.Nodes.value.push(n)
  }

  AddLink(v1: number, v2: number, type: number) {
    if (v1 > v2) {
      ;[v1, v2] = [v2, v1]
    }
    // Cantor pairing
    const uid = 0.5 * (v1 + v2) * (v1 + v2 + 1) + v2
    if (this.Links.value[uid] == undefined) {
      this.Links.value[uid] = <Link>{ uid, v1, v2, type }
    }
  }

  // handle control plane msg from each node
  handleMsg = (msg: Message) => {
    switch (msg.type) {
      case MSG_TYPE.DONE:
        if (++this.doneCnt == this.Config.value.num_nodes) {
          this.SlotDone.value = true
        }
        console.log(this.doneCnt, this.SlotDone.value)
        break
    }
  }

  // forward physical layer pkt from each node
  handlePkt = (pkt: Packet) => {
    this.Nodes.value[pkt.mac_dst].w!.postMessage(pkt)
    this.Packets.value.push(pkt)
    this.PacketsCurrent.value.push(pkt)
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
