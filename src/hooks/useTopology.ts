import { onMounted, watch } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts'
import 'echarts-gl'

import { Nodes, TopoConfig, PacketsCurrent, SlotDone, SelectedNode } from './useStates'

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

  // const paddingGrid = 2
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
            // [
            //   [0 - paddingGrid, 0 - paddingGrid],
            //   [0 - paddingGrid, TopoConfig.grid_y + paddingGrid],
            //   [TopoConfig.grid_x + paddingGrid, TopoConfig.grid_y + paddingGrid],
            //   [TopoConfig.grid_x + paddingGrid, 0 - paddingGrid],
            //   [0 - paddingGrid, 0 - paddingGrid]
            // ]
          ],
          type: 'Polygon'
        }
      }
    ]
  }
  const option: any = {
    geo3D: {
      map: 'grid',
      label: {
        show: false,
        color: 'white',
        // echarts-gl bug, can only use label formatter to detect hover event
        formatter: (item: any) => {
          if (item.status == 'emphasis') {
            SelectedNode.value = parseInt(item.name)
          }
          return item.name
        }
      },
      shading: 'lambert',
      emphasis: {
        itemStyle: {
          color: 'royalblue',
          opacity: 0.7
        }
      },
      groundPlane: {
        show: true,
        color: '#2a2a2a'
      },
      environment: '#1e1e1e',
      light: {
        main: {
          intensity: 1,
          shadow: true,
          shadowQuality: 'high',
          alpha: 30
        }
      },
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
        distance: 140,
        maxAlpha: 180,
        // alpha: 45,
        // beta: 0,
        maxBeta: 360,
        minBeta: -360,
        center: [0, -20, 0],
        panMouseButton: 'left',
        rotateMouseButton: 'right'
      },
      zlevel: -10,
      regionHeight: 3,
      regions: []
    },
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
        zlevel: -11,
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
          // constantSpeed: 2
          period: 0.4
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.01,
          opacity: 0.01
        },
        data: [],
        silent: true,
        zlevel: -12
      }
    ]
  }

  function drawNodes() {
    for (const n of Nodes.value) {
      if (n.id == 0) continue

      // echarts-gl bug, must include each node to regions here to enable label and hover event simultaneously
      option.geo3D.regions.push({ name: `${n.id}`, label: { show: true } })
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
    echarts.registerMap('grid', gridMap)

    chart.setOption(option)
  }

  const drawnLinks: any = {}
  function drawLinks() {
    for (const n of Nodes.value) {
      for (const nn of n.neighbors) {
        const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
        if (drawnLinks[linkName] == null) {
          drawnLinks[linkName] = true
          option.series[0].data.push([n.pos, Nodes.value[nn].pos])
        }
      }
    }
  }

  function drawCurrentPackets() {
    option.series[1].data = []
    for (const pkt of PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        option.series[1].data.push([Nodes.value[pkt.src].pos, Nodes.value[pkt.dst].pos])
      }
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
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons', { useDirtyRect: true })
    drawNodes()
  })

  watch(
    SlotDone,
    () => {
      if (SlotDone.value) {
        drawLinks()
        drawCurrentPackets()
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

  watch(SelectedNode, () => {
    console.log(SelectedNode.value)
  })
}
