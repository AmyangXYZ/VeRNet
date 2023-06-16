import { watch } from 'vue'
import * as echarts from 'echarts'

import { ASN, PacketsCurrent, SchConfig, SignalReset, SlotDone } from './useStates'

export function useChannels(): any {
  const drawChannels = function (chartDom: any) {
    const chart = echarts.init(chartDom.value, { useDirtyRect: true })
    const zoomWindow: number = 60

    const option: any = {
      // tooltip: {
      //   trigger: 'axis'
      // },
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

    for (let c = 1; c <= SchConfig.num_channels; c++) {
      option.yAxis.data.push(c * 3, c * 3 + 1, c * 3 + 2)
      option.series.push({
        name: `Packet`,
        step: 'middle',
        type: 'line',
        data: [c * 3],
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

    watch(SlotDone, () => {
      if (SlotDone.value) {
        for (let c = 1; c <= SchConfig.num_channels; c++) {
          if (PacketsCurrent.value.filter((pkt) => pkt.ch == c).length > 0) {
            option.series[c - 1].data.push(c * 3 - 2, c * 3)
          } else {
            option.series[c - 1].data.push(c * 3, c * 3)
          }
          if (ASN.value * 3 > option.xAxis.data.length) {
            for (let s = ASN.value * 3; s < ASN.value * 3 + zoomWindow / 2 - 3; s++) {
              option.xAxis.data.push(s)
            }
          }
          option.dataZoom[0].startValue = option.xAxis.data.length - zoomWindow
          chart.setOption(option)
        }
      } else {
        for (let c = 1; c <= SchConfig.num_channels; c++) {
          option.series[c - 1].data.push(c * 3)
        }
      }
    })

    watch(SignalReset, () => {
      for (let c = 1; c <= SchConfig.num_channels; c++) {
        option.series[c - 1].data = []
      }
      chart.setOption(option)
    })
  }

  return { drawChannels }
}
