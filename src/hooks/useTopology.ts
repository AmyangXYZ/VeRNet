import { onMounted, watch, nextTick } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, MarkLineComponent, CanvasRenderer])

import { Nodes, SchConfig, ASN, Packets } from './useStates'

import type {
  TopologyConfig,
  Node,
  Cell,
  Packet,
  CMD_ASN_PAYLOAD,
  CMD_INIT_PAYLOAD,
  ASSOC_RSP_PAYLOAD
} from './typedefs'
import { PKT_ADDR, PKT_TYPES } from './typedefs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopology(config: TopologyConfig, chartDom: any) {
  let chart: any

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
    const rand = new SeededRandom(config.seed)

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

    for (let i = 1; i <= config.num_nodes; i++) {
      const n: Node = {
        id: i,
        pos: [
          Math.floor(rand.next() * (config.grid_x - 1)) + 1,
          Math.floor(rand.next() * (config.grid_y - 1)) + 1
        ],
        joined: i == 1,
        neighbors: [],
        w: new Worker(new URL('./node.ts', import.meta.url), { type: 'module' })
      }

      Nodes.value.push(n)
      // assign id
      n.w.postMessage(<Packet>{
        type: PKT_TYPES.CMD_INIT,
        src: 0,
        dst: n.id,
        len: 3,
        payload: <CMD_INIT_PAYLOAD>{
          id: n.id,
          pos: n.pos,
          sch_config: JSON.parse(JSON.stringify(SchConfig))
        }
      })

      if (n.id == 1) {
        const assocRsp: Packet = <Packet>{
          type: PKT_TYPES.ASSOC_RSP,
          src: 0,
          dst: n.id,
          len: 4,
          asn: 1,
          payload: <ASSOC_RSP_PAYLOAD>{
            id: n.id,
            schedule: <Cell[]>[{ slot: 1, ch: 1, src: n.id, dst: -1 }]
          }
        }
        n.w.postMessage(assocRsp)
      }

      // act as controller that handles packets sent from each node
      n.w.onmessage = ({ data: pkt }: any) => {
        if (pkt.dst == PKT_ADDR.CONTROLLER) {
          // mgmt or debug/stats packets to controller
          switch (pkt.type) {
            case PKT_TYPES.CMD_STAT:
              break
            case PKT_TYPES.ASSOC_REQ:
              // new node join
              // console.log(`new node join: ${pkt.payload.id}->${pkt.payload.parent}`)
              if (!Nodes.value[pkt.payload.id].joined) {
                Nodes.value[pkt.payload.id].joined = true

                Nodes.value[pkt.payload.id].neighbors.push(pkt.payload.parent)
                Nodes.value[pkt.payload.parent].neighbors.push(pkt.payload.id)
                const assocRsp: Packet = <Packet>{
                  type: PKT_TYPES.ASSOC_RSP,
                  uid: Math.floor(Math.random() * 0xffff),
                  ch: 2,
                  src: 0,
                  dst: pkt.payload.id,
                  seq: 0,
                  asn: ASN.value,
                  len: 4,
                  payload: <ASSOC_RSP_PAYLOAD>{
                    id: pkt.payload.id,
                    schedule: <Cell[]>[
                      { slot: pkt.payload.id + 20, ch: 1, src: pkt.payload.id, dst: -1 }
                    ]
                  }
                }
                assocRsp.id = Packets.value.length
                assocRsp.children = [
                  { payload_detail: JSON.stringify(assocRsp.payload).replace(/"/g, '') }
                ]
                Packets.value.push(assocRsp)
                Nodes.value[pkt.payload.id].w.postMessage(assocRsp)

                setTimeout(async () => {
                  nextTick(() => {
                    draw()
                  })
                }, 5)
              }
              break
            default:
              break
          }
        } else {
          // normal mgmt or data packets to be forwarded

          // check channel interference
          channels[pkt.ch].push(pkt)
          if (channels[pkt.ch].length == 1 || pkt.type == PKT_TYPES.ACK) {
            pkt.id = Packets.value.length
            pkt.children = [{ payload_detail: JSON.stringify(pkt.payload).replace(/"/g, '') }]
            Packets.value.push(pkt)

            if (pkt.dst == PKT_ADDR.BROADCAST) {
              for (const nn of Nodes.value) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (nn.id > 0 && nn.id != n.id && distance <= config.tx_range) {
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
                if (distance <= config.tx_range) {
                  nn.w.postMessage(pkt)
                }
              }
            }
          }
        }
      }
    }
  }

  let channels: any = {}

  function draw() {
    option.xAxis.max = config.grid_x
    option.yAxis.max = config.grid_y
    option.series[0].data = []
    option.series[0].markLine.data = []

    for (const n of Nodes.value) {
      option.series[0].data.push({
        value: n.pos,
        name: n.id
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
            type: PKT_TYPES.CMD_ASN,
            dst: n.id,
            payload: <CMD_ASN_PAYLOAD>{ asn: ASN.value }
          })
        }
      }
    }
  })

  watch(
    config,
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
