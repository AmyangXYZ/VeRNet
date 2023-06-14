import { ref, watch, toRaw } from 'vue'
import { ASN, Nodes, Packets, TopoConfig, SchConfig, PacketsCurrent, SlotDone } from './useStates'
import { useSchedule } from './useSchedule'
import { useTopology } from './useTopology'
import type {
  Message,
  Packet,
  Cell,
  MSG_INIT_PAYLOAD,
  MSG_ASN_PAYLOAD,
  ASSOC_RSP_PAYLOAD
} from './typedefs'
import { CELL_TYPES, MSG_TYPES, PKT_TYPES, ADDR } from './typedefs'

export function useController() {
  const initController = function () {
    let doneCnt = 0
    // set up msg/pkt handler
    for (const n of Nodes.value) {
      if (n.id == ADDR.CONTROLLER) continue
      n.w.postMessage(<Message>{
        type: MSG_TYPES.INIT,
        payload: <MSG_INIT_PAYLOAD>{
          id: n.id,
          pos: toRaw(n.pos),
          sch_config: toRaw(SchConfig)
        }
      })

      // handle messages and packets sent from each node
      n.w.onmessage = (e: any) => {
        // msg or pkt
        if ('ch' in e.data == false) {
          const msg: Message = e.data
          switch (msg.type) {
            case MSG_TYPES.STAT:
              n.joined = true
              n.neighbors.push(msg.payload.parent)
              Nodes.value[msg.payload.parent].neighbors.push(n.id)
              break
            case MSG_TYPES.DONE:
              doneCnt++
              if (doneCnt == TopoConfig.num_nodes) {
                SlotDone.value = true
              }
              break
            case MSG_TYPES.ASSOC_REQ: {
              // new node join
              // console.log(`new node join: ${msg.payload.id}->${msg.payload.parent}`)
              const new_node: number = msg.payload.id
              const parent: number = msg.payload.parent

              // to improve
              const topo_check = !Nodes.value[new_node].joined

              if (topo_check) {
                Nodes.value[ADDR.ROOT].w.postMessage(<Packet>{
                  type: PKT_TYPES.ASSOC_RSP,
                  uid: Math.floor(Math.random() * 0xffff),
                  ch: 2,
                  src: 0,
                  dst: ADDR.ROOT,
                  seq: 0,
                  asn: ASN.value,
                  len: 7,
                  payload: <ASSOC_RSP_PAYLOAD>{
                    permit: true,
                    id: new_node,
                    parent: parent,
                    schedule: <Cell[]>[
                      {
                        type: CELL_TYPES.MGMT,
                        slot: new_node + 6,
                        ch: 1,
                        src: new_node,
                        dst: ADDR.BROADCAST
                      }
                      // {
                      //   type: CELL_TYPES.MGMT,
                      //   slot: msg.payload.id + 12,
                      //   ch: Math.floor(Math.random() * 4) + 2,
                      //   src: new_node,
                      //   dst: parent
                      // },
                      // {
                      //   type: CELL_TYPES.MGMT,
                      //   slot:new_node + 12,
                      //   ch: Math.floor(Math.random() * 4) + 2,
                      //   src: parent,
                      //   dst: new_node
                      // }
                    ]
                  }
                })
              }
              break
            }
          }
        } else {
          const pkt: Packet = e.data

          // check channel interference, only one packet can be transmitted on each channel in a slot
          if (
            PacketsCurrent.value.filter((p) => p.ch == pkt.ch).length == 0 ||
            pkt.type == PKT_TYPES.ACK
          ) {
            // must use this format for the detailedView function of el-table-v2
            pkt.id = Packets.value.length
            pkt.children = [
              {
                id: `${Packets.value.length}-detail-content`,
                detail: JSON.stringify(pkt.payload).replace(/"/g, '')
              }
            ]

            Packets.value.push(pkt)
            PacketsCurrent.value.push(pkt)

            if (pkt.dst == ADDR.BROADCAST) {
              for (const nn of Nodes.value) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (nn.id > 0 && nn.id != n.id && distance <= TopoConfig.tx_range) {
                  nn.w.postMessage(pkt)
                }
              }
            } else {
              const nn = Nodes.value[pkt.dst]
              if (nn != null) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (distance <= TopoConfig.tx_range) {
                  nn.w.postMessage(pkt)
                }
              }
            }
          }
        }
      }
    }

    watch(ASN, () => {
      doneCnt = 0
      PacketsCurrent.value = []
      if (Nodes.value.length > 1) {
        for (const n of Nodes.value) {
          if (n.id > 0) {
            n.w.postMessage(<Packet>{
              type: MSG_TYPES.ASN,
              dst: n.id,
              payload: <MSG_ASN_PAYLOAD>{ asn: ASN.value }
            })
          }
        }
      }
    })
  }

  const initNetwork = function () {
    const { initTopology } = useTopology()
    const { initSchedule } = useSchedule()
    initTopology()
    initSchedule()
    initController()
  }

  const status = ref({
    initiated: false,
    running: false,
    timer: 0
  })

  // auto inc ASN
  const run = function () {
    if (!status.value.initiated) {
      initNetwork()
      status.value.initiated = true
    }
    status.value.running = true
    status.value.timer = setInterval(() => {
      SlotDone.value = false
      ASN.value++
    }, 500)
  }
  // ASN++
  const step = function () {
    if (!status.value.initiated) {
      initNetwork()
      status.value.initiated = true
    }
    ASN.value++
    SlotDone.value = false
  }
  const pause = function () {
    status.value.running = false
    clearInterval(status.value.timer)
  }
  const reset = function () {
    status.value.running = false
    clearInterval(status.value.timer)
    ASN.value = 0
    initNetwork()
  }

  return { initNetwork, status, run, step, pause, reset }
}
