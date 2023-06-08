import { watch, onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, CanvasRenderer])

import type { ScheduleConfig } from './defs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useSchedule(config: ScheduleConfig, chartDom: any) {
  let chart: any
  const option: any = {
    grid: {},
    xAxis: {},
    yAxis: {},
    series: [
      {
        type: 'line',
        data: [1, 2, 3]
      }
    ]
  }

  function draw() {
    chart.setOption(option)
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    draw()
  })
  watch(isDark, () => {
    chart.dispose()
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    draw()
  })
}
