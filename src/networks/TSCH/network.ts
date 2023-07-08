import { ref, watch, toRaw } from 'vue'
import type { Ref } from 'vue'
import type {
  Cell,
  Message,
  Packet,
  TSCHNodeMeta,
  TopologyConfig,
  ScheduleConfig,
  MsgHandler,
  INIT_MSG_PAYLOAD,
  ASN_MSG_PAYLOAD,
  ASSOC_RSP_PKT_PAYLOAD
} from './typedefs'
import { ADDR, MSG_TYPES, PKT_TYPES, CELL_TYPES } from './typedefs'
import { SeededRandom } from '@/hooks/useSeed'
import { NODE_TYPE } from '../typedef'

export class TSCHNetwork {
  ID = 11
  Nodes = ref<TSCHNodeMeta[]>([])
  Packets = ref<Packet[]>([])
  ASN = ref(0)
  Schedule = ref<Cell[][]>([])
  TopoConfig: Ref<TopologyConfig>
  SchConfig: Ref<ScheduleConfig>
  SignalReset = ref(0)
  PacketsCurrent = ref<Packet[]>([])
  SlotDone = ref(true)
  Running = ref(false)
  SlotDuration = ref(1000)
  asnTimer = 0
  doneCnt = 0

  msgHandlers: { [type: number]: MsgHandler } = {}

  constructor() {
    this.SlotDuration.value = 750
    this.TopoConfig = ref<TopologyConfig>({
      seed: 9,
      num_nodes: 20,
      grid_size: 100,
      tx_range: 20
    })
    this.SchConfig = ref<ScheduleConfig>({
      num_slots: 40,
      num_channels: 8,
      beacon_channel: 1,
      beacon_period: 1,
      shared_channel: 2,
      num_shared_slots: 8
    })

    this.registerMsgHandler(MSG_TYPES.DONE, this.doneMsgHandler)
    this.registerMsgHandler(MSG_TYPES.STAT, this.statMsgHandler)
    this.registerMsgHandler(MSG_TYPES.ASSOC_REQ, this.assocReqMsgHandler)

    this.createNodes()
    this.createSchedule()

    watch(this.ASN, () => {
      this.doneCnt = 0
      this.PacketsCurrent.value = []
      if (this.Nodes.value.length > 1) {
        for (const n of this.Nodes.value) {
          if (n.w != undefined) {
            n.w.postMessage(<Packet>{
              type: MSG_TYPES.ASN,
              dst: n.id,
              payload: <ASN_MSG_PAYLOAD>{ asn: this.ASN.value }
            })
          }
        }
      }
    })
    watch(this.SignalReset, () => {
      this.ASN.value = 0
      this.Packets.value = []
      this.PacketsCurrent.value = []
      this.createNodes()
      this.createSchedule()
    })
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

  registerMsgHandler(type: number, handler: MsgHandler) {
    this.msgHandlers[type] = handler
  }
  doneMsgHandler = () => {
    if (++this.doneCnt == this.TopoConfig.value.num_nodes) {
      this.SlotDone.value = true
    }
  }
  statMsgHandler = (msg: Message) => {
    const payload = msg.payload
    const node = msg.src

    if (!this.Nodes.value[node].joined && payload.joined) {
      // join succeed
      // console.log(node, 'joined')
      this.Nodes.value[node].joined = payload.joined
      this.Nodes.value[node].parent = payload.parent
      this.Nodes.value[node].neighbors.push(payload.parent)
      this.Nodes.value[payload.parent].neighbors.push(node)
    }

    this.Nodes.value[node].queueLen = payload.queue.length
    this.Nodes.value[node].tx_cnt = payload.tx_cnt
    this.Nodes.value[node].rx_cnt = payload.rx_cnt
    this.Nodes.value[node].rank = payload.rank
  }
  assocReqMsgHandler = (msg: Message) => {
    const new_node: number = msg.payload.id
    const parent: number = msg.payload.parent

    // to improve
    const topo_check = !this.Nodes.value[new_node].joined

    if (topo_check) {
      const p = <Packet>{
        type: PKT_TYPES.ASSOC_RSP,
        uid: Math.floor(Math.random() * 0xffff),
        ch: 2,
        src: 0,
        dst: ADDR.ROOT,
        seq: 0,
        len: 7,
        payload: <ASSOC_RSP_PKT_PAYLOAD>{
          permit: true,
          id: new_node,
          parent: parent,
          cell_list: this.assignMgmtCells(new_node, parent)
        }
      }
      this.Nodes.value[ADDR.ROOT].w!.postMessage(p)
    }
  }

  createNodes = () => {
    const rand = new SeededRandom(this.TopoConfig.value.seed)

    // clear old nodes
    if (this.Nodes.value.length > 1) {
      for (const n of this.Nodes.value) {
        if (n.w != undefined) {
          n.w.terminate()
        }
      }
    }
    this.Nodes.value = [
      <TSCHNodeMeta>{
        id: 0,
        type: NODE_TYPE.TSCH,
        pos: [0, 0],
        joined: false,
        parent: 0,
        neighbors: [],
        queueLen: 0,
        tx_cnt: 0,
        rx_cnt: 0,
        rank: 0,
        w: undefined
      }
    ] // placeholder

    for (let i = 1; i <= this.TopoConfig.value.num_nodes; i++) {
      const n = <TSCHNodeMeta>{
        id: i,
        type: NODE_TYPE.TSCH,
        pos: [
          Math.floor(rand.next() * (this.TopoConfig.value.grid_size - 20)) - 40, // -40 to 40
          Math.floor(rand.next() * (this.TopoConfig.value.grid_size - 20)) - 40 // -40 to 40
        ],
        joined: i == ADDR.ROOT,
        parent: 0,
        neighbors: [],
        queueLen: 0,
        tx_cnt: 0,
        rx_cnt: 0,
        rank: 0,
        w: new Worker(new URL('@/networks/TSCH/node.ts', import.meta.url), { type: 'module' })
      }
      // send init msg
      n.w!.postMessage(<Message>{
        type: MSG_TYPES.INIT,
        payload: <INIT_MSG_PAYLOAD>{
          id: n.id,
          pos: toRaw(n.pos),
          sch_config: toRaw(this.SchConfig.value)
        }
      })
      // handle msg/pkt from nodes
      n.w!.onmessage = (e: any) => {
        if ('ch' in e.data == false) {
          const msg: Message = e.data
          if (this.msgHandlers[msg.type] != undefined) {
            this.msgHandlers[msg.type](msg)
          } else {
            console.log('!! undefined message type:', msg.type)
          }
        } else {
          const pkt: Packet = e.data
          // check channel interference, only one packet can be transmitted on each channel in a slot
          if (
            this.PacketsCurrent.value.filter((p) => p.ch == pkt.ch).length == 0 ||
            pkt.type == PKT_TYPES.ACK
          ) {
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

            if (pkt.dst == ADDR.BROADCAST) {
              for (const nn of this.Nodes.value) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (nn.id > 0 && nn.id != n.id && distance <= this.TopoConfig.value.tx_range) {
                  nn.w!.postMessage(pkt)
                }
              }
            } else {
              const nn = this.Nodes.value[pkt.dst]
              if (nn != undefined) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (distance <= this.TopoConfig.value.tx_range) {
                  nn.w!.postMessage(pkt)
                }
              }
            }
          }
        }
      }
      this.Nodes.value.push(n)
    }
  }

  createSchedule = () => {
    this.Schedule.value = new Array<Cell[]>(this.SchConfig.value.num_slots + 1)
    for (let s = 1; s <= this.SchConfig.value.num_slots; s++) {
      this.Schedule.value[s] = new Array<Cell>(this.SchConfig.value.num_channels + 1)
    }

    // initial cells
    this.Schedule.value[1][this.SchConfig.value.beacon_channel] = <Cell>{
      type: CELL_TYPES.MGMT,
      slot: 1,
      ch: this.SchConfig.value.beacon_channel,
      src: ADDR.ROOT,
      dst: ADDR.BROADCAST
    }
    for (let slot = 2; slot < 2 + this.SchConfig.value.num_shared_slots; slot++) {
      this.Schedule.value[slot][this.SchConfig.value.shared_channel] = <Cell>{
        type: CELL_TYPES.SHARED,
        slot: slot,
        ch: this.SchConfig.value.shared_channel,
        src: ADDR.ANY,
        dst: ADDR.ANY
      }
    }
  }
  assignMgmtCells = (node: number, parent: number): Cell[] => {
    const cells: Cell[] = []
    // beacon
    const beacon_cell = this.findIdleCell(CELL_TYPES.MGMT, node, ADDR.BROADCAST)
    const tx_cell = this.findIdleCell(CELL_TYPES.MGMT, node, parent)
    const tx_cell2 = this.findIdleCell(CELL_TYPES.MGMT, node, parent)
    const rx_cell = this.findIdleCell(CELL_TYPES.MGMT, parent, node)
    const rx_cell2 = this.findIdleCell(CELL_TYPES.MGMT, parent, node)

    if (
      beacon_cell != undefined &&
      tx_cell != undefined &&
      tx_cell2 != undefined &&
      rx_cell != undefined &&
      rx_cell2 != undefined
    ) {
      cells.push(beacon_cell, tx_cell, tx_cell2, rx_cell, rx_cell2)
    }
    return cells
  }
  findIdleCell = (type: number, src: number, dst: number): Cell | undefined => {
    for (let slot = 2; slot <= this.SchConfig.value.num_slots; slot++) {
      // check conflict
      if (
        this.Schedule.value[slot].filter(
          (x) =>
            x.src == src ||
            x.src == dst ||
            x.dst == src ||
            x.dst == dst ||
            x.type == CELL_TYPES.SHARED
        ).length > 0
      ) {
        continue
      }
      if (dst == ADDR.BROADCAST) {
        if (this.Schedule.value[slot][this.SchConfig.value.beacon_channel] == undefined) {
          const cell = <Cell>{
            type: type,
            slot: slot,
            ch: this.SchConfig.value.beacon_channel,
            src: src,
            dst: dst
          }
          this.Schedule.value[slot][this.SchConfig.value.beacon_channel] = cell
          return cell
        }
      } else {
        for (let ch = 2; ch <= this.SchConfig.value.num_channels; ch++) {
          if (this.Schedule.value[slot][ch] == undefined) {
            const cell = <Cell>{
              type: type,
              slot: slot,
              ch: ch,
              src: src,
              dst: dst
            }
            this.Schedule.value[slot][ch] = cell
            return cell
          }
        }
      }
    }
    return undefined
  }
}
