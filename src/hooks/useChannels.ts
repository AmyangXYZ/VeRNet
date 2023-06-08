import { watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, TooltipComponent, DataZoomComponent, GridComponent, CanvasRenderer])

import type { ScheduleConfig } from './defs'

import { ASN, Packets } from './useStates'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useChannels(config: ScheduleConfig, chartDom: any) {
  let chart: any
  const zoomWindow: number = 16
  const option: any = {
    tooltip: {
      trigger: 'item'
    },
    grid: {
      top: '1%',
      bottom: '56px',
      left: '32px',
      right: '1%'
    },
    dataZoom: [
      {
        type: 'slider',
        // startValue: 0,
        // endValue: 0,
        maxValueSpan: zoomWindow,
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
      minInterval: 1,
      axisLine: {
        show: true
      },
      data: [],
      animation: false
    },
    yAxis: {
      name: 'Channels',
      nameLocation: 'center',
      nameGap: 20,
      type: 'category',
      axisLabel: {
        show: true,
        interval: 0
      },
      splitLine: { show: true, interval: 0 },
      data: [],
      inverse: true
    },
    series: [
      {
        name: `Packet`,
        symbol: 'circle',
        symbolSize: 10,
        type: 'scatter',
        data: [],
        // animationDurationUpdate:200,
        animation: false
      }
    ]
  }

  function initChart() {
    option.xAxis.data = []
    option.yAxis.data = []
    // option.series = []
    for (let c = 1; c <= config.num_channels; c++) {
      option.yAxis.data.push(`${c}`)
    }
    for (let t = 1; t <= zoomWindow; t++) {
      option.xAxis.data.push(`${t}`)
    }
    chart.setOption(option)
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    initChart()
  })

  watch(ASN, () => {
    if (ASN.value > zoomWindow) {
      option.xAxis.data.push(ASN.value)
      option.dataZoom[0].startValue = ASN.value - zoomWindow
      chart.setOption(option)
    }
  })

  watch(
    Packets,
    () => {
      if (Packets.value.length > 0) {
        nextTick(() => {
          const pkt = Packets.value[Packets.value.length - 1]
          option.series[0].data.push({
            name: '0x' + pkt.uid.toString(16).toUpperCase().padStart(4, '0'),
            value: [pkt.asn - 1, pkt.ch - 1]
          })

          chart.setOption(option)
        })
      }
    },
    { deep: true }
  )
  watch(isDark, () => {
    chart.dispose()
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    initChart()
  })
}
