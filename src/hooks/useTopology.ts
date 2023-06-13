import { ref, onMounted, watch } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts'
import 'echarts-gl'

import { Nodes, TopoConfig, PacketsCurrent, SlotDone, SelectedNode } from './useStates'

import type { Node } from './typedefs'
import { ADDR, PKT_TYPES } from './typedefs'

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
    features: []
  }
  // let alpha = 40
  const editing = ref(false)
  const option: any = {
    toolbox: {
      feature: {
        myToolEdit: {
          show: true,
          title: 'Edit topology',
          icon: 'path://M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z',
          onclick: () => {
            if (editing.value) {
              chart.off('click')
              editing.value = false
              chart.setOption(
                {
                  // graphic: [],
                  geo3D: { viewControl: { alpha: 40 } }
                },
                { replaceMerge: ['xAxis', 'yAxis', 'geo', 'graphic'] }
              )
              return
            }
            editing.value = true
            chart.setOption({
              grid: {
                top: 2,
                bottom: 2,
                left: 2,
                right: 2
              },
              xAxis: {
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: {
                  show: true,
                  interval: 0,
                  lineStyle: { color: 'lightgrey', opacity: 0.1 }
                },
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                zlevel: -9
              },
              yAxis: {
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: {
                  show: true,
                  interval: 0,
                  lineStyle: { color: 'lightgrey', opacity: 0.1 }
                },
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                zlevel: -9
              },
              geo: {
                map: 'grid',
                itemStyle: { opacity: 0 },
                aspectScale: 1,
                zlevel: -9,
                zoom: 1.148,
                emphasis: {
                  label: { show: false }
                }
              },
              geo3D: {
                viewControl: {
                  distance: 140,
                  beta: 0,
                  center: [0, -20, 0],
                  alpha: 90
                }
              }
            })
            chart.on('click', ({ event }: any) => {
              const pos = [event.offsetX, event.offsetY]
              chart.setOption({
                graphic: [
                  {
                    type: 'circle',
                    position: pos,
                    shape: { r: 8, cx: 0, cy: 0 },
                    style: {
                      fill: 'red'
                    },
                    draggable: true,
                    z: 100,
                    zlevel: 1,
                    ondrag: (item: any) => {
                      Nodes.value[SelectedNode.value].pos = chart.convertFromPixel('geo', [
                        item.offsetX,
                        item.offsetY
                      ])
                      drawNode(SelectedNode.value)
                    }
                  }
                ]
              })
            })
          }
        }
      }
    },
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
        color: '#1f0025'
      },
      // environment: '#1e1e1e',
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
        geo3DIndex: 0,
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
        geo3DIndex: 0,
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

  // to support draggable
  function drawNode(id: number) {
    const center = Nodes.value[id].pos //
    const radius = 7
    const numSegments = 8 // The more segments, the smoother the circle

    const coordinates = generateNodeCoordinates(center, radius, numSegments)
    gridMap.features = gridMap.features.filter((item: any) => item.properties.id != id)
    gridMap.features.push({
      type: 'Feature',
      properties: {
        id: id,
        name: `${id}`
      },
      geometry: {
        coordinates: [coordinates],
        type: 'Polygon'
      }
    })
    // console.log(Nodes.value[id].pos,gridMap.features[id - 1].coordinates[0])
    // gridMap = JSON.parse(JSON.stringify(gridMap))
    echarts.registerMap('grid', gridMap)
    chart.setOption(option)
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
    chart = echarts.init(chartDom.value)
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

  watch(SelectedNode, () => {
    // console.log(SelectedNode.value)
  })
}
