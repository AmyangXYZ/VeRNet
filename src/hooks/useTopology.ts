import { ref, onMounted, watch, nextTick } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, MarkLineComponent, CanvasRenderer])

import { Packets } from './useStates'

import type { TopoConfig, Node, Packet } from './defs'
import { PKT_TYPE, CMD_TYPE } from './defs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopology(config: TopoConfig, chartDom: any): any {
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
        symbolSize: 16,
        data: [],
        itemStyle: {
          opacity: 1,
          color: 'rgba(52,136,255,1)'
        },
        label: {
          show: true,
          fontSize: 11,
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
    nodes.value = [{ id: 0, pos: [], w: {}, neighbors: [] }]
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
        type: PKT_TYPE.CMD,
        src: 0,
        dst: n.id,
        len: 2,
        payload: [CMD_TYPE.ASSIGN_ID, n.id]
      })

      n.w.onmessage = ({ data: pkt }: any) => {
        if (pkt.type == PKT_TYPE.CMD) {
          switch (pkt.payload[0]) {
            case CMD_TYPE.NEIGHBOR:
              n.neighbors = pkt.payload.slice(1)
              if (joined[n.id] == null) {
                joined[n.id] = true
                n.w.postMessage(<Packet>{
                  type: PKT_TYPE.CMD,
                  dst: n.id,
                  len: 1,
                  payload: [CMD_TYPE.BEACON]
                })
                setTimeout(async () => {
                  nextTick(() => {
                    draw()
                  })
                }, 5)
              }
              break
            case CMD_TYPE.STAT:
              break
          }
        } else {
          // forward mgmt and data packets
          Packets.value.push(pkt)

          if (pkt.dst != -1) {
            const nn = nodes.value[pkt.dst]
            if (nn != null) {
              const distance = Math.sqrt(
                Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
              )
              if (distance <= config.tx_range) {
                nn.w.postMessage(pkt)
              }
            }
          } else {
            for (const nn of nodes.value) {
              const distance = Math.sqrt(
                Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
              )
              if (nn.id > 0 && nn.id != n.id && distance <= config.tx_range) {
                nn.w.postMessage(pkt)
              }
            }
          }
        }
      }
    }

    // let root node start beacon process
    joined[1] = true
    nodes.value[1].w.postMessage(<Packet>{
      type: PKT_TYPE.CMD,
      dst: 1,
      len: 1,
      payload: [CMD_TYPE.BEACON]
    })
  }

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
