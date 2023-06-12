import { onMounted, watch } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts/core'
import { GeoComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Lines3DChart } from 'echarts-gl/charts'
import { Geo3DComponent } from 'echarts-gl/components'

echarts.use([GeoComponent, Geo3DComponent, Lines3DChart, CanvasRenderer])

import { Nodes, TopoConfig, PacketsCurrent, SlotDone } from './useStates'

import type { Node } from './typedefs'
import { ADDR, PKT_TYPES } from './typedefs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopology(chartDom: any) {
  createNodes()

  function createNodes() {
    const rand = new SeededRandom(TopoConfig.seed)

    // clear old nodes
    if (Nodes.value.length > 1) {
      for (const n of Nodes.value) {
        if (n.id > 0) {
          n.w.terminate()
        }
      }
    }
    Nodes.value = [<Node>{ id: 0, pos: [], joined: false, w: {}, neighbors: [] }] // placeholder

    for (let i = 1; i <= TopoConfig.num_nodes; i++) {
      const n = <Node>{
        id: i,
        pos: [
          Math.floor(rand.next() * (TopoConfig.grid_x - 1)) + 1,
          Math.floor(rand.next() * (TopoConfig.grid_y - 1)) + 1
        ],
        joined: i == ADDR.ROOT,
        neighbors: [],
        w: new Worker(new URL('./node.ts', import.meta.url), { type: 'module' })
      }

      Nodes.value.push(n)
    }
  }

  let chart: any

  const paddingGrid = 2
  const gridMap: any = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 0,
          name: 'base'
        },
        geometry: {
          coordinates: [
            [
              [0 - paddingGrid, 0 - paddingGrid],
              [0 - paddingGrid, TopoConfig.grid_y + paddingGrid],
              [TopoConfig.grid_x + paddingGrid, TopoConfig.grid_y + paddingGrid],
              [TopoConfig.grid_x + paddingGrid, 0 - paddingGrid],
              [0 - paddingGrid, 0 - paddingGrid]
            ]
          ],
          type: 'Polygon'
        }
      }
    ]
  }
  const option: any = {
    geo3D: [
      {
        map: 'grid',
        silent: true,
        label: {
          show: true,
          color: 'white'
        },
        environment: '#1e1e1e',
        itemStyle: {
          color: 'royalblue'
        },
        postEffect: {
          enable: true
        },
        boxWidth: 100,
        boxDepth: 100,
        boxHeight: 1,
        viewControl: {
          distance: 120,
          maxAlpha: 180,
          alpha: 60,
          maxBeta: 720,
          center: [0, -15, 0],
          panMouseButton: 'left',
          rotateMouseButton: 'right'
        },
        zlevel: -10,
        regionHeight: 3,
        regions: [{ name: 'base', height: 1, itemStyle: { color: '#111' }, label: { show: false } }]
      }
    ],
    series: [
      {
        name: 'links',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        lineStyle: {
          width: 1.5,
          opacity: 0.2
        },
        data: [],
        zlevel: -9,
        silent: true
      },
      {
        name: 'Packets',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        effect: {
          show: true,
          trailColor: 'white',
          trailWidth: 2,
          trailOpacity: 0.8,
          trailLength: 0.12,
          delay: 0,
          // constantSpeed: 1,
          period: .6
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.01,
          opacity: 0.01
        },
        data: [],
        silent: true,
        zlevel: -8
      },
      {
        name: 'BroadcastPackets',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        effect: {
          show: true,
          trailColor: 'white',
          trailWidth: 2,
          trailOpacity: 0.8,
          trailLength: 0.12,
          delay: 0,
          constantSpeed: 1,
          // period: 2
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.01,
          opacity: 0.01
        },
        data: [],
        silent: true,
        zlevel: -7
      }
    ]
  }

  function drawNodes() {
    for (const n of Nodes.value) {
      if (n.id == 0) continue
      const center = n.pos // San Francisco, for example
      const radius = 7
      const numSegments = 8 // The more segments, the smoother the circle

      const coordinates = generateNodeCoordinates(center, radius, numSegments)
      gridMap.features.push({
        type: 'Feature',
        properties: {
          id: n.id,
          name: `${n.id}`
        },
        geometry: {
          coordinates: [coordinates],
          type: 'Polygon'
        }
      })
    }
    echarts.registerMap('grid', gridMap, {})
    chart.setOption(option)
  }

  const drawnLinks: any = {}
  function drawLinks() {
    // option.series[0].data = []
    for (const n of Nodes.value) {
      for (const nn of n.neighbors) {
        const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
        if (drawnLinks[linkName] == null) {
          drawnLinks[linkName] = true
          option.series[0].data.push([n.pos, Nodes.value[nn].pos])
          chart.appendData({
            seriesIndex: 0,
            data: [[n.pos, Nodes.value[nn].pos]]
          })
        }
      }
    }
  }

  function drawCurrentPackets() {
    // option.series[1].data = []
    for (const pkt of PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        // option.series[1].data.push([Nodes.value[pkt.src].pos, Nodes.value[pkt.dst].pos])
        chart.appendData({
          seriesIndex: 1,
          data: [[Nodes.value[pkt.src].pos, Nodes.value[pkt.dst].pos]]
        })
      }
      // if (pkt.dst == ADDR.BROADCAST) {
      //   const coords = generateNodeCoordinates(Nodes.value[pkt.src].pos, 100, 50)
      //   const data = []
      //   for (const coord of coords) {
      //     data.push([toRaw(Nodes.value[pkt.src].pos), coord])
      //   }
        
        // console.log(coords, data)
        // chart.appendData({
        //   seriesIndex: 2,
        //   data: data
        // })
      // }
    }
  }

  function generateNodeCoordinates(
    center: number[],
    radius: number,
    numSegments: number
  ): number[][] {
    const distanceX = radius / (10 * Math.cos((center[1] * Math.PI) / 180))
    const distanceY = radius / 10
    const coordinates: number[][] = []

    for (let i = 0; i < numSegments; i++) {
      const theta = (i / numSegments) * (2 * Math.PI)
      const dx = distanceX * Math.cos(theta)
      const dy = distanceY * Math.sin(theta)

      const point: number[] = [center[0] + dx, center[1] + dy]
      coordinates.push(point)
    }
    // Add the first point again at the end to close the circle
    coordinates.push(coordinates[0])

    return coordinates
  }

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    drawNodes()
  })

  watch(
    SlotDone,
    () => {
      if (SlotDone.value) {
        drawLinks()
        drawCurrentPackets()
        // chart.setOption(option)
      } else {
        // clear packets in last slot
        chart.setOption(option)
      }
    },
    { deep: true }
  )

  watch(
    TopoConfig,
    () => {
      createNodes()
      drawNodes()
    },
    { deep: true }
  )

  watch(isDark, () => {
    chart.dispose()
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    drawNodes()
  })
}
