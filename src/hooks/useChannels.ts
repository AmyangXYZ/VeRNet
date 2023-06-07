import { watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, CanvasRenderer])

import type { ChannelConfig } from './defs'

import { Packets } from './useStates'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useChannels(config: ChannelConfig, chartDom: any) {
  let chart: any
  const option: any = {
    grid: {
      top: '1%',
      bottom: '32px',
      left: '32px',
      right: '1%'
    },
    xAxis: {
      name: 'Time',
      type: 'time',
      nameLocation: 'center',
      nameGap: 20,
      axisLine: {
        show: true
      },
      data: []
    },
    yAxis: {
      name: 'Channels',
      nameLocation: 'center',
      nameGap: 20,
      type: 'category',
      splitLine: { show: true },
      data: [],
      inverse: true
    },
    series: []
  }

  function initChart() {
    option.xAxis.data = []
    option.yAxis.data = []
    option.series = []
    for (let c = 1; c <= config.num_channels; c++) {
      option.yAxis.data.push(c)
      option.series.push({
        name: `Channel ${c}`,
        symbol: 'path://M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z',
        symbolSize: 10,
        type: 'scatter',
        data: [],
        // animation:false,
      })
    }
    chart.setOption(option)
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    initChart()
  })

  watch(
    Packets,
    () => {
      nextTick(() => {
        const pkt = Packets.value[Packets.value.length - 1]
        option.xAxis.data.push(pkt.time)
        option.series[pkt.ch].data.push([pkt.time, pkt.ch])
        chart.setOption(option)
      })
    },
    { deep: true }
  )

  watch(isDark, () => {
    chart.dispose()
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    initChart()
  })
}
