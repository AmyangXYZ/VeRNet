import { onMounted, watch, nextTick } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, MarkLineComponent, CanvasRenderer])

import { Nodes, TopoConfig, SchConfig, ASN, Packets } from './useStates'

import type {
  Node,
  Cell,
  Message,
  Packet,
  MSG_ASN_PAYLOAD,
  MSG_INIT_PAYLOAD,
  ASSOC_RSP_PAYLOAD
} from './typedefs'
import { MSG_TYPES, ADDR, PKT_TYPES, CELL_TYPES } from './typedefs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopology(chartDom: any) {
  let chart: any
  let channels: any = {}

  const option: any = {
    grid: {
      top: '1%',
      bottom: '1%',
      left: '1%',
      right: '1%'
    },
    xAxis: {
      name: 'grid_x',
      type: 'value',
      data: [],
      interval: 1,
      max: 20,
      axisLabel: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      },
      splitLine: {
        show: true
      },
      min: 0,
      label: { show: false }
    },
    yAxis: {
      name: 'grid_y',
      min: 0,
      max: 20,
      type: 'value',
      interval: 1,
      data: [],
      splitLine: {
        show: true
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        show: false
      },
      label: { show: false }
    },
    series: [
      {
        z: 10,
        name: 'Node',
        type: 'scatter',
        symbolSize: 17,
        data: [],
        itemStyle: {
          opacity: 1
          // color: 'rgba(52,136,255,1)'
        },
        label: {
          show: true,
          fontSize: 10.5,
          fontWeight: 600,
          color: 'white',
          formatter: (item: any) => {
            return item.name
          }
        },
        markLine: {
          z: 1,
          symbol: 'none',
          lineStyle: {
            width: 1,
            // color: 'grey',
            type: 'dashed'
          },
          data: [],
          silent: true
        },
        animation: false
      }
    ]
  }

  createNodes()

  function createNodes() {
    const rand = new SeededRandom(TopoConfig.seed)
    ASN.value = 0
    Packets.value = []

    // clear old nodes
    if (Nodes.value.length > 1) {
      for (const n of Nodes.value) {
        if (n.id > 0) {
          n.w.terminate()
        }
      }
    }
    Nodes.value = [<Node>{ id: 0, pos: [], joined: false, w: {}, neighbors: [] }] // placeholder

    for (let i = 1; i <= TopoConfig.num_nodes; i++) {
      const n: Node = {
        id: i,
        pos: [
          Math.floor(rand.next() * (TopoConfig.grid_x - 1)) + 1,
          Math.floor(rand.next() * (TopoConfig.grid_y - 1)) + 1
        ],
        joined: i == ADDR.ROOT,
        neighbors: [],
        w: new Worker(new URL('./node.ts', import.meta.url), { type: 'module' })
      }

      Nodes.value.push(n)
      // assign id
      n.w.postMessage(<Message>{
        type: MSG_TYPES.INIT,
        payload: <MSG_INIT_PAYLOAD>{
          id: n.id,
          pos: n.pos,
          sch_config: JSON.parse(JSON.stringify(SchConfig))
        }
      })

      // handle messages and packets sent from each node
      n.w.onmessage = (e: any) => {
        // msg or pkt
        if ('ch' in e.data == false) {
          const msg: Message = e.data
          switch (msg.type) {
            case MSG_TYPES.STAT:
              break

            case MSG_TYPES.ASSOC_REQ: {
              // new node join
              // console.log(`new node join: ${msg.payload.id}->${msg.payload.parent}`)
              const new_node: number = msg.payload.id
              const parent: number = msg.payload.parent

              // to improve
              const topo_check = !Nodes.value[new_node].joined

              if (topo_check) {
                Nodes.value[new_node].joined = true

                Nodes.value[new_node].neighbors.push(parent)
                Nodes.value[parent].neighbors.push(new_node)

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
                        slot: msg.payload.id + 20,
                        ch: 1,
                        src: msg.payload.id,
                        dst: ADDR.BROADCAST
                      },
                      {
                        type: CELL_TYPES.DATA,
                        slot: msg.payload.id + 60,
                        ch: Math.floor(Math.random() * 4) + 2,
                        src: msg.payload.id,
                        dst: parent
                      }
                    ]
                  }
                })

                setTimeout(async () => {
                  nextTick(() => {
                    draw()
                  })
                }, 5)
              }
              break
            }
          }
        } else {
          const pkt: Packet = e.data
          // check channel interference, only one packet can be transmitted on each channel in a slot
          if (pkt.ch in channels) {
            channels[pkt.ch].push(pkt)
          } else {
            channels[pkt.ch] = [pkt]
          }
          if (channels[pkt.ch].length == 1 || pkt.type == PKT_TYPES.ACK) {
            pkt.id = Packets.value.length
            pkt.children = [{ payload_detail: JSON.stringify(pkt.payload).replace(/"/g, '') }]
            Packets.value.push(pkt)

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
  }

  function draw() {
    option.xAxis.max = TopoConfig.grid_x
    option.yAxis.max = TopoConfig.grid_y
    option.series[0].data = []
    option.series[0].markLine.data = []

    for (const n of Nodes.value) {
      option.series[0].data.push({
        value: n.pos,
        name: n.id,
        itemStyle: {
          color: n.joined ? 'royalblue' : '#999'
          // opacity: n.joined?1:.4
        }
      })
    }

    const drawnLinks: any = {}
    for (const n of Nodes.value) {
      if (n.neighbors.length > 0) {
        for (const nn of n.neighbors) {
          const nbr = Nodes.value[nn]
          if (nbr != null) {
            const name = n.id > nbr.id ? `${n.id}-${nbr.id}` : `${nbr.id}-${n.id}`
            if (drawnLinks[name] == null) {
              drawnLinks[name] = 1
              option.series[0].markLine.data.push([
                {
                  name: name,
                  label: {
                    show: false
                  },
                  coord: n.pos
                },
                {
                  coord: nbr.pos,
                  lineStyle: {
                    width: 1
                  }
                }
              ])
            }
          }
        }
      }
    }

    chart.setOption(option)
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    draw()
  })

  watch(ASN, () => {
    if (Nodes.value.length > 1) {
      channels = {}
      for (let c = 1; c <= 8; c++) {
        channels[c] = []
      }
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

  watch(
    TopoConfig,
    () => {
      createNodes()
      draw()
    },
    { deep: true }
  )

  watch(isDark, () => {
    chart.dispose()
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    draw()
  })
}
