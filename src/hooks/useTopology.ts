import { ref, onMounted, watch, nextTick } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, MarkLineComponent, CanvasRenderer])

import { SchConfig, ASN, Packets } from './useStates'

import type {
  TopologyConfig,
  Node,
  Packet,
  CMD_ASN_PAYLOAD,
  CMD_INIT_PAYLOAD,
  CMD_RUN_PAYLOAD
} from './defs'
import { PKT_ADDR, PKT_TYPE } from './defs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopology(config: TopologyConfig, chartDom: any): any {
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
  const nodes = ref<Node[]>([])

  createNodes()
  function createNodes() {
    const rand = new SeededRandom(config.seed)
    const joined: any = {}

    Packets.value = []

    // clear old nodes
    if (nodes.value.length > 1) {
      for (const n of nodes.value) {
        if (n.id > 0) {
          n.w.terminate()
        }
      }
    }
    nodes.value = [{ id: 0, pos: [], w: {}, neighbors: [] }] // placeholder

    for (let i = 1; i <= config.num_nodes; i++) {
      const n: Node = {
        id: i,
        pos: [
          Math.floor(rand.next() * (config.grid_x - 1)) + 1,
          Math.floor(rand.next() * (config.grid_y - 1)) + 1
        ],
        neighbors: [],
        w: new Worker(new URL('./node.ts', import.meta.url), { type: 'module' })
      }
      nodes.value.push(n)
      // assign id
      n.w.postMessage(<Packet>{
        type: PKT_TYPE.CMD_INIT,
        src: 0,
        dst: n.id,
        len: 3,
        payload: <CMD_INIT_PAYLOAD>{
          id: n.id,
          pos: n.pos,
          sch_config: SchConfig
        }
      })

      // act as controller that handles packets sent from each node
      n.w.onmessage = ({ data: pkt }: any) => {
        if (pkt.dst == PKT_ADDR.CONTROLLER) {
          // mgmt or debug/stats packets to controller
          switch (pkt.type) {
            case PKT_TYPE.CMD_STAT:
              break
            case PKT_TYPE.ASSOC_REQ:
              // new node join
              // console.log(`new node join: ${pkt.payload.id}->${pkt.payload.parent}`)
              if (joined[pkt.payload.id] == null) {
                joined[pkt.payload.id] = true

                nodes.value[pkt.payload.id].neighbors.push(pkt.payload.parent)
                nodes.value[pkt.payload.parent].neighbors.push(pkt.payload.id)

                nodes.value[pkt.payload.id].w.postMessage(<Packet>{
                  type: PKT_TYPE.MGMT_SCH,
                  dst: pkt.payload.id,
                  len: 1
                  // payload:
                })
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
          if (channels[pkt.ch].length == 1 || pkt.type == PKT_TYPE.ACK) {
            Packets.value.push(pkt)

            if (pkt.dst == PKT_ADDR.BROADCAST) {
              for (const nn of nodes.value) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (nn.id > 0 && nn.id != n.id && distance <= config.tx_range) {
                  nn.w.postMessage(pkt)
                }
              }
            } else {
              const nn = nodes.value[pkt.dst]
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

    // let root node start beacon process
    joined[1] = true
    nodes.value[1].w.postMessage(<Packet>{
      type: PKT_TYPE.CMD_RUN,
      dst: 1,
      len: 1,
      payload: <CMD_RUN_PAYLOAD>{}
    })
  }

  let channels: any = {}

  function draw() {
    option.xAxis.max = config.grid_x
    option.yAxis.max = config.grid_y
    option.series[0].data = []
    option.series[0].markLine.data = []

    for (const n of nodes.value) {
      option.series[0].data.push({
        value: n.pos,
        name: n.id
      })
    }

    const drawnLinks: any = {}
    for (const n of nodes.value) {
      if (n.neighbors.length > 0) {
        for (const nn of n.neighbors) {
          const nbr = nodes.value[nn]
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
    if (nodes.value.length > 1) {
      channels = {}
      for (let c = 1; c <= 8; c++) {
        channels[c] = []
      }
      for (const n of nodes.value) {
        if (n.id > 0) {
          n.w.postMessage(<Packet>{
            type: PKT_TYPE.CMD_ASN,
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

  return nodes
}
