import { watch } from 'vue'
import * as echarts from 'echarts'

import { Network } from './useStates'

export function useDrawChannels(chartDom: HTMLElement) {
  const chart = echarts.init(chartDom, { useDirtyRect: true })
  const zoomWindow: number = 60

  const option: any = {
    grid: {
      top: '34px',
      bottom: '27px',
      left: '32px',
      right: '1%'
    },
    dataZoom: [
      {
        type: 'slider',
        throttle: 0,
        bottom: 0,
        height: 20
      }
    ],
    xAxis: {
      name: 'ASN',
      type: 'category',
      nameLocation: 'center',
      nameGap: 20,
      position: 'top',
      axisLine: {
        show: true
      },
      axisTick: { interval: 2 },
      axisLabel: {
        rotate: 40,
        interval: 0,
        formatter: (i: any) => {
          if (i % 3 == 2) {
            return (parseInt(i) + 1) / 3
          }
          return ''
        }
      },
      data: [],
      animation: false
    },
    yAxis: {
      name: 'Channels',
      type: 'value',
      nameLocation: 'center',
      nameGap: 20,
      interval: 1,
      axisLabel: {
        interval: 3,
        show: true,
        formatter: (i: any) => {
          if (i % 3 == 2) {
            return (parseInt(i) + 1) / 3
          }
          return ''
        }
      },
      splitLine: { show: false },
      data: [],
      inverse: true
    },
    series: []
  }

  for (let c = 1; c <= Network.SchConfig.value.num_channels; c++) {
    option.yAxis.data.push(c * 3, c * 3 + 1, c * 3 + 2)
    option.series.push({
      name: `Packet`,
      step: 'middle',
      type: 'line',
      data: [],
      symbol: 'none',
      lineStyle: {
        width: 1,
        color: 'deepgreen'
      },
      // animationDurationUpdate: 10000
      animation: false,
      silent: true
    })
  }
  for (let t = 1; t <= zoomWindow; t++) {
    option.xAxis.data.push(`${t}`)
  }

  chart.setOption(option)

  watch(Network.SlotDone, () => {
    if (Network.SlotDone.value) {
      for (let c = 1; c <= Network.SchConfig.value.num_channels; c++) {
        if (Network.PacketsCurrent.value.filter((pkt) => pkt.ch == c).length > 0) {
          option.series[c - 1].data.push(c * 3, c * 3 - 2, c * 3)
        } else {
          option.series[c - 1].data.push(c * 3, c * 3, c * 3)
        }
        if (Network.ASN.value * 3 > option.xAxis.data.length) {
          for (let s = (Network.ASN.value - 1) * 3 + 1; s < Network.ASN.value * 3 + 1; s++) {
            option.xAxis.data.push(s)
          }
        }
        option.dataZoom[0].startValue = option.xAxis.data.length - zoomWindow
        chart.setOption(option)
      }
    }
  })

  watch(Network.SignalReset, () => {
    option.dataZoom[0].startValue = 0
    option.xAxis.data = []
    for (let t = 1; t <= zoomWindow; t++) {
      option.xAxis.data.push(`${t}`)
    }
    for (let c = 1; c <= Network.SchConfig.value.num_channels; c++) {
      option.series[c - 1].data = []
    }
    chart.setOption(option)
  })
}
