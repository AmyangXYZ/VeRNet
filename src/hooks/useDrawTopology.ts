import { ref, watch } from 'vue'

import * as echarts from 'echarts'
import 'echarts-gl'

import { SelectedNode, SignalResetCamera } from './useStates'

import texture from '@/assets/texture.jpg'

import { Network } from './useStates'

import { ADDR, PKT_TYPES } from '@/networks/TSCH/typedefs'

export function useDrawTopology(chartDom: HTMLElement) {
  const chart = echarts.init(chartDom, { useDirtyRect: true })
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
    features: [
      // {
      //   type: 'Feature',
      //   properties: {
      //     id: 100,
      //     name: `100`
      //   },
      //   geometry: {
      //     coordinates: [
      //       [
      //         [1, 80],

      //         [80, 1],
      //         [1, 80]
      //       ]
      //     ],
      //     type: 'Polygon'
      //   }
      // }
    ]
  }
  const gridBase: any = {
    type: 'FeatureCollection',
    features: [
      
    ]
  }
  echarts.registerMap('grid', gridBase)
  const editing = ref(false)

  chart.on('click', (item) => {
    // console.log(item,editing.value)
    SelectedNode.value = parseInt(item.name)
    if (editing.value) {
      const pos = [item.event?.offsetX, item.event?.offsetY]
      chart.setOption({
        geo: {
          map: '6tisch',
          aspectScale: 1,
          silent: true,
          itemStyle: { opacity: 0 },
          zlevel: 10,
          zoom: 1.055
        },
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
                Network.Nodes.value[SelectedNode.value].pos = chart.convertFromPixel('geo', [
                  item.offsetX,
                  item.offsetY
                ])
                drawNode(SelectedNode.value)
              }
            }
          }
        ]
      })
    }
  })

  const option: any = {
    toolbox: {
      top: '16px',
      left: '16px',
      itemSize: 16,
      feature: {
        mySettings: {
          show: true,
          title: 'Settings',
          icon: 'path://M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z',
          onclick: () => {
            console.log('open settings panel')
          }
        },
        myToolEdit: {
          show: true,
          title: 'Edit topology',
          icon: 'path://M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z',
          onclick: () => {
            if (editing.value) {
              editing.value = false
              option.geo3D[0].viewControl.distance = 180
              option.geo3D[0].viewControl.alpha = 50
              option.geo3D[0].viewControl.beta = 0
              option.geo3D[0].viewControl.center = [0, -20, 0]
              option.series[0].viewControl.distance = 180
              option.series[0].viewControl.alpha = 50
              option.series[0].viewControl.beta = 0
              option.series[0].viewControl.center = [0, -20, 0]
              chart.setOption(option, { replaceMerge: ['geo', 'graphic'] })
              return
            }

            editing.value = true
            option.geo3D[0].viewControl.distance = 180
            option.geo3D[0].viewControl.alpha = 90
            option.geo3D[0].viewControl.beta = 0
            option.geo3D[0].viewControl.center = [0, -20, 0]
            option.series[0].viewControl.distance = 180
            option.series[0].viewControl.alpha = 90
            option.series[0].viewControl.beta = 0
            option.series[0].viewControl.center = [0, -20, 0]
            chart.setOption(option)
          }
        }
      }
    },
    geo3D: [
      {
        map: '6tisch',
        groundPlane: {
          show: false
        },
        itemStyle: { opacity: 0 },
        label: { show: false, color: 'white' },
        silent: true,
        boxWidth: 100,
        boxDepth: 100,
        boxHeight: 1,
        viewControl: {
          distance: 180,
          maxAlpha: 180,
          alpha: 50,
          // beta: 0,
          maxBeta: 360,
          minBeta: -360,
          center: [0, -20, 0],
          panMouseButton: 'left',
          rotateMouseButton: 'right'
        },
        regions: [],
        zlevel: -11
      }
    ],
    series: [
      {
        type: 'map3D',
        map: '6tisch',
        shading: 'realistic',
        realisticMaterial: {
          roughness: 0.5,
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
            shadowQuality: 'medium',
            alpha: 30
          }
        },
        label: {
          show: true,
          color: 'white'
        },
        emphasis: {
          itemStyle: {
            color: '#007fff',
            opacity: 0.1
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
          distance: 180,
          maxAlpha: 180,
          alpha: 50,
          // beta: 0,
          maxBeta: 360,
          minBeta: -360,
          center: [0, -20, 0],
          panMouseButton: 'left',
          rotateMouseButton: 'right'
        },
        regions: [],
        regionHeight: 3,
        zlevel: -11
      },
      {
        name: 'links',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        geo3DIndex: 0,
        lineStyle: {
          width: 1.2,
          opacity: 0.8
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
          trailOpacity: 1,
          trailLength: 0.12,
          // constantSpeed: 2
          period: (Network.SlotDuration.value / 1000) * 0.8
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.01,
          opacity: 0.01
        },
        data: [],
        // silent: true,
        zlevel: -10
      }
    ]
  }

  // to support draggable
  function drawNode(id: number) {
    const center = Network.Nodes.value[id].pos //
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

    drawLinks()
    drawCurrentPackets()
    chart.setOption(option)
  }

  function drawNodes() {
    // mapBase.features = []
    for (const n of Network.Nodes.value) {
      if (n.id == 0) continue

      const center = n.pos // San Francisco, for example
      const radius = 8
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
    }
    echarts.registerMap('6tisch', mapBase)
    chart.setOption(option)
  }

  function drawLinks() {
    option.series[1].data = []
    const drawnLinks: any = {}
    for (const n of Network.Nodes.value) {
      for (const nn of n.neighbors) {
        const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
        if (drawnLinks[linkName] == undefined) {
          drawnLinks[linkName] = true
          option.series[1].data.push([n.pos, Network.Nodes.value[nn].pos])
        }
      }
    }
  }

  function drawCurrentPackets() {
    option.series[2].data = []
    for (const pkt of Network.PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        option.series[2].data.push([
          Network.Nodes.value[pkt.src].pos,
          Network.Nodes.value[pkt.dst].pos
        ])
      }
    }
  }

  function generateNodeCoordinates(
    center: number[],
    radius: number,
    numSegments: number
  ): number[][] {
    const distanceX = radius / (11 * Math.cos((center[1] * Math.PI) / 180))
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

  drawNodes()

  watch(
    Network.SlotDone,
    () => {
      if (Network.SlotDone.value) {
        drawLinks()
        drawCurrentPackets()
        chart.setOption(option)
      }
    },
    { deep: true }
  )

  watch(Network.SignalReset, () => {
    option.series[1].data = []
    option.series[2].data = []
    drawNodes()
    chart.setOption(option)
  })

  watch(SignalResetCamera, () => {
    option.geo3D[0].viewControl.distance = 180
    option.geo3D[0].viewControl.alpha = 50
    option.geo3D[0].viewControl.beta = 0
    option.geo3D[0].viewControl.center = [0, -20, 0]
    option.series[0].viewControl.distance = 180
    option.series[0].viewControl.alpha = 50
    option.series[0].viewControl.beta = 0
    option.series[0].viewControl.center = [0, -20, 0]
    chart.setOption(option)
  })
}
