import { ref, watch, onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, CanvasRenderer])

import { Packets } from './useStates'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useChannels(chartDom:any) {
  let chart: any
  const option: any = {
    grid: {
        
    },
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
