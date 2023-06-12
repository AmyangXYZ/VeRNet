import { watch, onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { HeatmapChart, LineChart } from 'echarts/charts'
import { GridComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, VisualMapComponent, HeatmapChart, GridComponent, CanvasRenderer])

import { CELL_TYPES, type Cell } from './typedefs'

import { SchConfig, Schedule } from './useStates'

export function useSchedule(chartDom: any) {
  let chart: any
  const option: any = {
    grid: {
      top: '42px',
      left: '40px',
      right: '12px',
      bottom: '2px'
    },
    xAxis: {
      name: 'Time',
      type: 'category',
      position: 'top',
      nameLocation: 'center',
      nameGap: '26',
      splitLine: {
        interval: 0,
        show: true
      },
      data: [1, 2, 3, 4, 5, 6]
    },
    yAxis: {
      name: 'Channel',
      type: 'category',
      inverse: true,
      nameLocation: 'center',
      nameGap: 20,
      axisLabel: {
        interval: 0
      },
      splitLine: {
        show: true
      },
      data: [1, 2, 3]
    },
    visualMap: {
      type: 'piecewise',
      pieces: [
        { value: CELL_TYPES.SHARED, label: 'Shared', color: 'grey' },
        { value: CELL_TYPES.MGMT, label: 'Mgmt', color: 'grey' },
        { value: CELL_TYPES.DATA, label: 'Data', color: 'grey' }
      ],
      itemHeight: 12,
      itemWidth: 18,
      top: 0,
      right: 10,
      orient: 'horizontal'
    },
    series: [
      {
        type: 'heatmap',
        data: []
      }
    ]
  }
  initSchedule()
  function initSchedule() {
    Schedule.value = new Array<Cell[]>(SchConfig.num_slots + 1)
    for (let s = 1; s <= SchConfig.num_slots; s++) {
      Schedule.value[s] = new Array<Cell>(SchConfig.num_channels + 1)
    }
  }

  function draw() {
    option.xAxis.data = []
    option.yAxis.data = []
    option.series[0].data = []
    for (let s = 1; s <= SchConfig.num_slots; s++) {
      option.xAxis.data.push(s)
    }
    for (let c = 1; c <= SchConfig.num_channels; c++) {
      option.yAxis.data.push(c)
    }
    for (let slot = 1; slot <= SchConfig.num_slots; slot++) {
      for (let ch = 1; ch <= SchConfig.num_channels; ch++) {
        const cell = Schedule.value[slot][ch]
        if (cell != null) {
          option.series[0].data.push([slot - 1, ch - 1, cell.type])
        }
      }
    }
    chart.setOption(option)
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value)
    draw()
  })
}
