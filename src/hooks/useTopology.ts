import { ref, watch } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts'
import 'echarts-gl'

import {
  Nodes,
  TopoConfig,
  PacketsCurrent,
  SlotDone,
  SelectedNode,
  SignalReset,
  SlotDuration
} from './useStates'

import texture from '@/assets/texture.jpg'

import type { Node } from './typedefs'
import { ADDR, PKT_TYPES } from './typedefs'

export function useTopology(): any {
  const initTopology = function () {
    const rand = new SeededRandom(TopoConfig.seed)

    // clear old nodes
    if (Nodes.value.length > 1) {
      for (const n of Nodes.value) {
        if (n.id > 0) {
          n.w.terminate()
        }
      }
    }
    Nodes.value = [<Node>{ id: 0, pos: [0, 0], joined: false, w: {}, parent: 0, neighbors: [] }] // placeholder

    for (let i = 1; i <= TopoConfig.num_nodes; i++) {
      const n = <Node>{
        id: i,
        pos: [
          Math.floor(rand.next() * (TopoConfig.grid_x - 1)) + 1,
          Math.floor(rand.next() * (TopoConfig.grid_y - 1)) + 1
        ],
        joined: i == ADDR.ROOT,
        parent: 0,
        neighbors: [],
        w: new Worker(new URL('./node.ts', import.meta.url), { type: 'module' })
      }

      Nodes.value.push(n)
    }
  }

  // called after mounted
  const drawTopology = function (chartDom: any) {
    const chart = echarts.init(chartDom.value, { useDirtyRect: true })
    chart.showLoading({
      text: 'Rendering...',
      textColor: 'lightgrey',
      fontSize: 15,
      maskColor: '#0e1116'
    })
    setTimeout(() => {
      chart.hideLoading()
    }, 800)
    const mapBase: any = {
      type: 'FeatureCollection',
      features: []
    }
    const editing = ref(false)
    const minimapMode = ref('scatter') // scatter or tree
    let treeNodes: any = { 1: { name: 1, children: [] } }
    const option: any = {
      toolbox: {
        itemSize: 16,
        feature: {
          myToolResetCamera: {
            show: true,
            title: 'Reset camera',
            icon: 'M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
            onclick: () => {
              chart.setOption({
                geo3D: [{ viewControl: { distance: 140, alpha: 40, beta: 0, center: [0, -10, 0] } }]
              })
              return
            }
          },
          myToolSwitchMinimap: {
            show: true,
            title: 'Switch minimap',
            icon: 'M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-4z',
            onclick: () => {
              if (minimapMode.value == 'scatter') {
                minimapMode.value = 'tree'
                option.series[2].data = []
                option.series[2].markLine.data = []
                drawMinimapTree()
                chart.setOption(option)
              } else {
                minimapMode.value = 'scatter'
                option.series[3].data = []
                drawMinimapScatter()
                chart.setOption(option, { replaceMerge: 'series' })
              }
            }
          },
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
                    geo3D: [
                      { viewControl: { distance: 140, alpha: 40, beta: 0, center: [0, -10, 0] } }
                    ]
                  },
                  { replaceMerge: ['geo', 'graphic'] }
                )
                return
              }
              editing.value = true
              chart.setOption({
                geo: [
                  {
                    map: '6tisch',
                    itemStyle: { opacity: 0 },
                    aspectScale: 1,
                    zlevel: 1,
                    zoom: 1.05,
                    emphasis: {
                      label: { show: false }
                    }
                  }
                ],
                geo3D: [{ viewControl: { distance: 140, alpha: 90, beta: 0, center: [0, -10, 0] } }]
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
                        if (SelectedNode.value > 0) {
                          Nodes.value[SelectedNode.value].pos = chart.convertFromPixel('geo', [
                            item.offsetX,
                            item.offsetY
                          ])

                          drawNode(SelectedNode.value)
                        }
                      }
                    }
                  ]
                })
              })
            }
          }
        }
      },
      grid: [{ top: '2px', height: '140px', width: '140px', left: '2px' }],
      xAxis: [
        {
          // name: 'minimap-x',
          type: 'value',
          splitLine: { show: true, lineStyle: { width: 0.3, color: 'lightgrey' } },
          splitNumber: 1,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          min: 0,
          max: TopoConfig.grid_x,
          zlevel: -4
        }
      ],
      yAxis: [
        {
          // name: 'minimap-y',
          type: 'value',
          splitNumber: 1,
          splitLine: { show: true, lineStyle: { width: 0.3, color: 'lightgrey' } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          min: 0,
          max: TopoConfig.grid_y,
          zlevel: -4
        }
      ],
      geo3D: [
        {
          // ground plane only
          map: '6tisch',
          shading: 'realistic',
          realisticMaterial: {
            roughness: 0,
            textureTiling: 1,
            detailTexture: texture
          },
          groundPlane: {
            show: true,
            color: '#0a0a0a'
          },
          light: {
            main: {
              intensity: 60,
              shadow: true,
              shadowQuality: 'high',
              alpha: 30
            }
          },
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
          emphasis: {
            itemStyle: {
              color: '#007fff',
              opacity: 0.8
            }
          },
          itemStyle: {
            color: '#007fff'
          },
          postEffect: {
            enable: true
          },
          environment: 'auto',
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
            center: [0, -10, 0],
            panMouseButton: 'left',
            rotateMouseButton: 'right'
          },
          regions: [],
          regionHeight: 3,
          zlevel: -10
        }
      ],
      series: [
        {
          name: 'links',
          type: 'lines3D',
          coordinateSystem: 'geo3D',
          geo3DIndex: 0,
          lineStyle: {
            width: 1,
            opacity: 0.4
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
            trailWidth: 1.5,
            trailOpacity: 0.6,
            trailLength: 0.12,
            delay: 0,
            // constantSpeed: 2
            period: (SlotDuration.value / 1000) * 0.8
          },
          blendMode: 'lighter',
          lineStyle: {
            width: 0.01,
            opacity: 0.01
          },
          data: [],
          // silent: true,
          zlevel: -12
        },
        {
          name: 'minimap-scatter',
          type: 'scatter',
          symbolSize: 5,
          data: [],
          itemStyle: {
            color: 'royalblue',
            opacity: 1
          },
          markLine: {
            z: 1,
            symbol: 'none',
            lineStyle: {
              width: 0.8,
              // color: 'grey',
              type: 'solid'
            },
            data: [],
            silent: true
          },
          zlevel: -5,
          animation: false,
          silent: true
        },
        {
          name: 'minimap-tree',
          type: 'tree',
          orient: 'TB',
          data: [],
          left: '2px',
          top: '7px',
          width: '140px',
          height: '127px',
          symbol: 'circle',
          symbolSize: 5,
          initialTreeDepth: -1,
          edgeShape: 'polyline',
          label: { show: false },
          itemStyle: {
            color: 'royalblue'
          },
          lineStyle: {
            width: 0.8,
            color: 'royalblue'
          },
          zlevel: -5,
          animation: false,
          silent: true
        }
      ]
    }

    // to support draggable
    function drawNode(id: number) {
      const center = Nodes.value[id].pos //
      const radius = 7
      const numSegments = 8 // The more segments, the smoother the circle

      const coordinates = generateNodeCoordinates(center, radius, numSegments)
      mapBase.features = mapBase.features.filter((item: any) => item.properties.id != id)
      mapBase.features.push({
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
      echarts.registerMap('6tisch', mapBase)

      // 2D
      if (minimapMode.value == 'scatter') {
        option.series[2].data = option.series[2].data.filter((item: any) => item.name != id)
        drawMinimapScatter()
      }

      drawLinks()
      drawCurrentPackets()
      chart.setOption(option)
    }

    function drawNodes() {
      mapBase.features = []
      for (const n of Nodes.value) {
        if (n.id == 0) continue

        // echarts-gl bug, must include each node to regions here to enable label and hover event simultaneously
        option.geo3D[0].regions.push({ name: `${n.id}`, label: { show: true } })
        const center = n.pos // San Francisco, for example
        const radius = 7
        const numSegments = 8 // The more segments, the smoother the circle

        const coordinates = generateNodeCoordinates(center, radius, numSegments)
        mapBase.features.push({
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
        // minimap
        option.series[2].data.push({
          name: n.id,
          value: n.pos
        })
      }
      echarts.registerMap('6tisch', mapBase)
      chart.setOption(option)
    }

    function drawLinks() {
      option.series[0].data = []
      const drawnLinks: any = {}
      for (const n of Nodes.value) {
        for (const nn of n.neighbors) {
          const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
          if (drawnLinks[linkName] == undefined) {
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

    function drawMinimapScatter() {
      option.series[2].data = []
      option.series[2].markLine.data = []
      const drawnLinks: any = {}
      for (const n of Nodes.value) {
        if (n.id == 0) continue
        option.series[2].data.push({
          name: n.id,
          value: n.pos
        })
        for (const nn of n.neighbors) {
          const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
          if (drawnLinks[linkName] == undefined) {
            drawnLinks[linkName] = true
            option.series[2].markLine.data.push([
              {
                name: linkName,
                label: {
                  show: false
                },
                coord: n.pos
              },
              {
                coord: Nodes.value[nn].pos
              }
            ])
          }
        }
      }
    }

    function drawMinimapTree() {
      for (const n of Nodes.value) {
        if (n.joined && n.parent != 0) {
          if (treeNodes[n.id] == undefined) {
            treeNodes[n.id] = { name: n.id, children: [] }
            if (treeNodes[n.parent] != undefined) {
              treeNodes[n.parent].children.push(treeNodes[n.id])
            } else {
              treeNodes[n.parent] = { name: n.id, children: [treeNodes[n.id]] }
            }
          }
        }
      }
      option.series[3].data = [treeNodes[1]]
    }

    drawNodes()

    watch(
      SlotDone,
      () => {
        if (SlotDone.value) {
          drawLinks()
          drawCurrentPackets()
          if (minimapMode.value == 'scatter') {
            drawMinimapScatter()
          } else {
            drawMinimapTree()
          }
          chart.setOption(option)
        }
      },
      { deep: true }
    )

    watch(SignalReset, () => {
      treeNodes = { 1: { name: 1, children: [] } }
      option.series[0].data = []
      option.series[1].data = []
      option.series[2].data = []
      option.series[2].markLine.data = []
      drawNodes()
      chart.setOption(option)
    })
  }
  return { initTopology, drawTopology }
}
