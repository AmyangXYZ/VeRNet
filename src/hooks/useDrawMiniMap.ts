import { watch } from 'vue'
import * as echarts from 'echarts'

import { Network } from './useStates'
import { MiniMapMode } from './useStates'
import { LINK_TYPE, NETWORK_TYPE } from '@/networks/common'
import type { TSCHNodeMeta } from '@/networks/TSCH/typedefs'
export function useDrawMiniMap(chartDom: HTMLElement) {
  const chart = echarts.init(chartDom, { useDirtyRect: true })

  const treeNodes: any = { 1: { name: 1, children: [] } }
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
      min: -(Network.TopoConfig.value.grid_size + 10) / 2,
      max: (Network.TopoConfig.value.grid_size + 10) / 2,
      zlevel: -4
    },
    yAxis: {
      //   name: 'minimap-y',
      type: 'value',
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      min: -(Network.TopoConfig.value.grid_size + 10) / 2,
      max: (Network.TopoConfig.value.grid_size + 10) / 2,
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
      },
      {
        name: 'minimap-tree',
        type: 'tree',
        orient: 'TB',
        data: [treeNodes[1]],
        left: '0px',
        top: '5px',
        bottom: '5px',
        width: '200px',
        height: '185px',
        symbol: 'circle',
        symbolSize: 6,
        initialTreeDepth: -1,
        edgeShape: 'polyline',
        label: { show: false },
        itemStyle: {
          color: 'royalblue'
        },
        lineStyle: {
          width: 0.8,
          color: 'royalblue'
        },
        selectedMode: 'single',
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
        value: n.pos
      })
    }
    for (const e of Network.EndSystems.value) {
      option.series[0].data.push({
        name: e.id,
        value: e.pos,
        itemStyle: { color: 'green' }
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
  function drawMinimapTree() {
    for (const n of Network.Nodes.value) {
      if (
        n.type == NETWORK_TYPE.TSCH &&
        (<TSCHNodeMeta>n).joined &&
        (<TSCHNodeMeta>n).parent != 0
      ) {
        if (treeNodes[n.id] == undefined) {
          treeNodes[n.id] = { name: n.id, children: [] }
          if (treeNodes[(<TSCHNodeMeta>n).parent] != undefined) {
            treeNodes[(<TSCHNodeMeta>n).parent].children.push(treeNodes[n.id])
          } else {
            treeNodes[(<TSCHNodeMeta>n).parent] = { name: n.id, children: [treeNodes[n.id]] }
          }
        }
      }
    }
    option.series[1].data = [treeNodes[1]]
  }

  drawMinimapScatter()
  drawMinimapTree()
  chart.setOption(option)
  chart.dispatchAction({ type: 'legendUnSelect', name: 'minimap-tree' })

  watch(
    Network.Nodes,
    () => {
      drawMinimapScatter()
      drawMinimapTree()
      chart.setOption(option)
    },
    { deep: true }
  )
  watch(
    Network.EndSystems,
    () => {
      drawMinimapScatter()
      drawMinimapTree()
      chart.setOption(option)
    },
    { deep: true }
  )

  watch(MiniMapMode, () => {
    if (MiniMapMode.value == 'scatter') {
      chart.dispatchAction({ type: 'legendToggleSelect', name: 'minimap-scatter' })
      chart.dispatchAction({ type: 'legendToggleSelect', name: 'minimap-tree' })
    } else {
      chart.dispatchAction({ type: 'legendToggleSelect', name: 'minimap-scatter' })
      chart.dispatchAction({ type: 'legendToggleSelect', name: 'minimap-tree' })
    }
  })
}
