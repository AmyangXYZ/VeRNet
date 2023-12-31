import { watch } from 'vue'
import * as echarts from 'echarts'

import { Network } from './useStates'
import { LINK_TYPE } from '@/core/typedefs'
export function useDrawMiniMap(chartDom: HTMLElement) {
  const chart = echarts.init(chartDom, { useDirtyRect: true })

  const option: any = {
    legend: { show: false },
    grid: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxis: {
      //   name: 'minimap-x',
      type: 'value',
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      min: -(Network.Config.value.grid_size + 10) / 2,
      max: (Network.Config.value.grid_size + 10) / 2,
      zlevel: -4
    },
    yAxis: {
      //   name: 'minimap-y',
      type: 'value',
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      min: -(Network.Config.value.grid_size + 10) / 2,
      max: (Network.Config.value.grid_size + 10) / 2,
      zlevel: -4,
      inverse: true
    },
    series: [
      {
        name: 'minimap-scatter',
        type: 'scatter',
        symbolSize: 6,
        data: [],
        itemStyle: {
          color: 'royalblue',
          opacity: 1
        },
        markLine: {
          z: 1,
          symbol: 'none',
          lineStyle: {
            width: 0.8,
            // color: 'grey',
            type: 'solid'
          },
          data: [],
          silent: true
        },
        zlevel: -5,
        animation: false,
        silent: true
      }
    ]
  }

  function drawMinimapScatter() {
    option.series[0].data = []
    option.series[0].markLine.data = []
    const drawnLinks: any = {}
    for (const n of Network.Nodes.value) {
      if (n.id == 0) continue
      option.series[0].data.push({
        name: n.id,
        value: n.pos,
        itemStyle: { color: n.type >= 4 ? 'green' : 'royalblue' }
      })
    }
    for (const l of Object.values(Network.Links.value)) {
      if (drawnLinks[l.uid] == undefined) {
        drawnLinks[l.uid] = true
        const coord1 = Network.Nodes.value[l.v1].pos
        const coord2 = Network.Nodes.value[l.v2].pos

        option.series[0].markLine.data.push([
          {
            name: l.uid,
            label: {
              show: false
            },
            lineStyle: {
              type: l.type == LINK_TYPE.WIRELESS ? 'dashed' : 'solid'
            },
            coord: coord1
          },
          {
            coord: coord2
          }
        ])
      }
    }
  }

  drawMinimapScatter()
  chart.setOption(option)

  watch(
    Network.Nodes,
    () => {
      drawMinimapScatter()
      chart.setOption(option)
    },
    { deep: true }
  )
}
