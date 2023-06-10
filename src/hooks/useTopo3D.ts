import { ref, watch, onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { GeoComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Lines3DChart } from 'echarts-gl/charts'
import { Geo3DComponent } from 'echarts-gl/components'

echarts.use([GeoComponent, Geo3DComponent, Lines3DChart, CanvasRenderer])

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopo3D(chartDom: any) {
  let chart: any
  const grid_width = 10
  const map = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [0,0],
          type: 'Point'
        },
        id: 0
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [
            [
              [0, 0],
              [0, grid_width],
              [grid_width, 0],
              [grid_width, 0],
              [0, 0]
            ]
          ],
          type: 'Polygon'
        }
      }
    ]
  }
  const option = {
    geo3D: {
      map: 'ite',
      silent: true,
      groundPlane: {
        show: true,
        color:"black"
      },
      // environment: "red",
      boxWidth:100,
      boxDepth:100,
      
      viewControl: {
        distance: 200,
        center: [0, 0, 0]
      }
    },
    series: [
      {
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        effect: {
          show: true,
          trailWidth: 2,
          trailOpacity: 0.8,
          trailLength: 0.2,
          constantSpeed: 50
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.2,
          opacity: 0.05
        },
        data: [
          [
            [0, 0],
            [0, grid_width]
          ],
          [
            [0, grid_width],
            [grid_width, grid_width]
          ],
          [
            [grid_width, grid_width],
            [grid_width, 0]
          ],
          [
            [grid_width, 0],
            [0, 0]
          ]
        ]
      }
    ]
  }

  function draw() {
    echarts.registerMap('ite', map)
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
