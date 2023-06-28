import { watch } from 'vue'
import * as echarts from 'echarts'

import { CELL_TYPES } from '@/networks/TSCH/typedefs'

import { Network, SignalShowSchedule } from './useStates'

export function useDrawSchedule(chartDom: HTMLElement): any {
  const chart = echarts.init(chartDom)
  const option: any = {
    grid: {
      top: '35px',
      left: '32px',
      right: '1px',
      bottom: '1px'
    },
    xAxis: {
      name: 'Time',
      type: 'category',
      position: 'top',
      nameLocation: 'center',
      nameGap: '22',
      interval: 0,
      splitLine: {
        interval: 0,
        show: true,
        lineStyle: { color: 'lightgrey', width: 0.5 }
      },
      axisTick: {
        interval: 0
      },
      axisLabel: {
        fontSize: 10
        // interval:0
      },
      data: []
    },
    yAxis: {
      name: 'Channels',
      type: 'category',
      inverse: true,
      nameLocation: 'center',
      nameGap: 20,
      axisLabel: {
        interval: 0,
        fontSize: 11
      },
      splitLine: {
        show: true,
        lineStyle: { color: 'lightgrey', width: 0.5 }
      },
      data: []
    },
    visualMap: {
      type: 'piecewise',
      pieces: [
        { value: CELL_TYPES.SHARED, label: 'Shared', color: 'green' },
        { value: CELL_TYPES.MGMT, label: 'Mgmt', color: 'red' },
        { value: CELL_TYPES.DATA, label: 'Data', color: 'royalblue' }
      ],
      textStyle: {
        color: 'grey'
      },
      itemHeight: 10,
      itemWidth: 15,
      top: -4,
      right: 0,
      orient: 'horizontal'
    },
    series: [
      {
        name: 'Schedule',
        type: 'heatmap',
        itemStyle: {
          borderColor: 'lightgrey',
          borderWidth: 0.5
        },
        label: { show: true, fontSize: 10 },
        animation: false,
        data: [],
        markLine: {
          lineStyle: { color: 'red' },
          symbolSize: 5,
          data: []
        }
      }
    ]
  }

  function drawCells() {
    option.xAxis.data = []
    option.yAxis.data = []
    option.series[0].data = []
    for (let s = 1; s <= Network.SchConfig.value.num_slots; s++) {
      option.xAxis.data.push(`${s}`)
    }
    for (let c = 1; c <= Network.SchConfig.value.num_channels; c++) {
      option.yAxis.data.push(`${c}`)
    }

    for (let slot = 1; slot <= Network.SchConfig.value.num_slots; slot++) {
      for (let ch = 1; ch <= Network.SchConfig.value.num_channels; ch++) {
        const cell = Network.Schedule.value[slot][ch]
        if (cell != undefined) {
          let label = `${cell.src}\n${cell.dst}`
          if (cell.type == CELL_TYPES.SHARED) {
            label = ''
          }
          option.series[0].data.push({
            value: [`${slot}`, `${ch}`, cell.type],
            name: label,
            label: {
              formatter: ({ name }: any) => name
            }
          })
        }
      }
    }
    chart.setOption(option)
  }

  function drawSlotOffset() {
    const slot =
      Network.ASN.value % Network.SchConfig.value.num_slots || Network.SchConfig.value.num_slots
    option.series[0].markLine.data = [
      {
        name: 'Slot offset',
        xAxis: slot - 1
      }
    ]
    chart.setOption(option)
  }

  watch(
    Network.Schedule,
    () => {
      drawCells()
    },
    { immediate: true, deep: true }
  )

  watch(Network.ASN, () => {
    drawSlotOffset()
  })

  watch(SignalShowSchedule, () => {
    setInterval(chart.resize, 50)
  })
}
