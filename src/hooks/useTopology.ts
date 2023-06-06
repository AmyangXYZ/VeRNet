import { ref, onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, GridComponent, MarkLineComponent, CanvasRenderer])

import { useDark } from '@vueuse/core'

const isDark = useDark()

export function useTopology(chartDom: any) {
  const nodes = ref([])

  const option = {
    grid: {
      top: '1%',
      bottom: '1%',
      left: '1%',
      right: '1%'
    },
    xAxis: {
      name: 'grid_x',
      type: 'value',
      data: [],
      interval: 1,
      max: 20,
      axisLabel: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      },
      splitLine: {
        show: true
      },
      min: 0,
      label: { show: false }
    },
    yAxis: {
      name: 'grid_y',
      min: 0,
      max: 20,
      type: 'value',
      interval: 1,
      data: [],
      splitLine: {
        show: true
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        show: false
      },
      label: { show: false }
    },
    series: [
      {
        z: 10,
        name: 'Node',
        type: 'scatter',
        symbolSize: 15,
        data: [],
        itemStyle: {
          opacity: 1,
          color: 'rgba(52,136,255,1)'
        },
        label: {
          show: true,
          fontSize: 10.5,
          fontWeight: 600,
          color: 'white',
          formatter: (item: any) => {
            return item.name
          }
        },
        markLine: {
          z: 1,
          symbol: 'none',
          lineStyle: {
            width: 1,
            color: 'grey',
            type: 'dashed'
          },
          data: [],
          silent: true
        },
        animation: false
      }
    ]
  }

  let chart = {}

  function draw() {
    option.series[0].data = []
    option.series[0].markLine.data = []
    option.xAxis.max = network.value.settings.grid_x
    option.yAxis.max = network.value.settings.grid_y

    for (let i in nodes.value) {
      option.series[0].data.push({
        value: nodes.value[i].pos,
        name: nodes.value[i].id
      })
    }

    let drawnLinks = {}
    for (let j = 0; j < nodes.value.length - 1; j++) {
      let start = nodes.value[j]
      if (start.neighbors == null) {
        continue
      }
      for (let k = 0; k < start.neighbors.length; k++) {
        let end = nodes.value[start.neighbors[k]]
        let name = start.id > end.id ? `${start.id}-${end.id}` : `${end.id}-${start.id}`
        if (drawnLinks[name] == null) {
          drawnLinks[name] = 1
          option.series[0].markLine.data.push([
            {
              name: name,
              label: {
                show: false
              },
              coord: start.pos
            },
            {
              coord: end.pos,
              lineStyle: {
                width: 1
              }
            }
          ])
        }
      }
    }
    chart.setOption(option)
  }

  function highlightApp(id) {
    if (id == -1) {
      for (let x = 0; x < option.series[0].data.length; x++) {
        option.series[0].data[x].itemStyle = {}
      }
      for (let y = 0; y < option.series[0].markLine.data.length; y++) {
        option.series[0].markLine.data[y][1].lineStyle = {}
      }
    } else {
      for (let x = 0; x < option.series[0].data.length; x++) {
        option.series[0].data[x].itemStyle = { opacity: 0.2 }
      }
      for (let y = 0; y < option.series[0].markLine.data.length; y++) {
        option.series[0].markLine.data[y][1].lineStyle = { width: 1, opacity: 0.2 }
      }
      let app = network.value.apps[selectedAppID.value]
      for (let i in app.tasks) {
        let task = app.tasks[i]
        for (let j in task.path) {
          option.series[0].data[task.path[j]].itemStyle = { color: 'orange' }
          if (j < task.path.length - 1) {
            let link = [task.path[j], task.path[parseInt(j) + 1]]
            for (let li = 0; li < option.series[0].markLine.data.length; li++) {
              let l = option.series[0].markLine.data[li]
              if (l[0].name == `${link[0]}-${link[1]}` || l[0].name == `${link[1]}-${link[0]}`) {
                l[1].lineStyle = { width: 2 }
              }
            }
          }
        }
      }
    }
    chart.setOption(option)
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark ? 'dark' : 'macarons')
    draw()
  })

  return { nodes }
}
