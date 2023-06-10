import { onMounted, watch, nextTick } from 'vue'
import { SeededRandom } from './seed'

import * as echarts from 'echarts/core'
import { GeoComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Lines3DChart } from 'echarts-gl/charts'
import { Geo3DComponent } from 'echarts-gl/components'

echarts.use([GeoComponent, Geo3DComponent, Lines3DChart, CanvasRenderer])

import { Nodes, TopoConfig, SchConfig, ASN, Packets } from './useStates'

import type {
  Node,
  Cell,
  Message,
  Packet,
  MSG_ASN_PAYLOAD,
  MSG_INIT_PAYLOAD,
  ASSOC_RSP_PAYLOAD
} from './typedefs'
import { MSG_TYPES, ADDR, PKT_TYPES, CELL_TYPES } from './typedefs'

import { useDark } from '@vueuse/core'
const isDark = useDark()

export function useTopology(chartDom: any) {
  let chart: any
  let channels: any = {}

  const grid_size: number = 32
  const gridMap: any = {
    type: 'FeatureCollection',
    features: [
      // {
      //   type: 'Feature',
      //   properties: {},
      //   geometry: {
      //     coordinates: [
      //       // [-grid_size, -grid_size],
      //       // [grid_size*2, grid_size*2]
      //     ],
      //     type: 'LineString'
      //   }
      // }
    ]
  }
  const option: any = {
    geo3D: {
      map: 'grid',
      // silent: true,
      label: {
        show: true,
        color: 'white'
      },
      shading: 'lambert',
      groundPlane: {
        show: true,
        color: 'black'
      },
      itemStyle: {
        color: 'royalblue'
      },
      // environment: '#121212',
      boxWidth: 100,
      boxDepth: 100,
      boxHeight: 100,
      viewControl: {
        distance: 160,
        // alpha: 70,
        maxAlpha: 180,
        maxBeta: 720,
        center: [0, -30, 0]
      },
      regionHeight: 3,
      regions: [{ name: 'node22', itemStyle: { color: 'red' }, height: 20 }]
    },
    series: [
      {
        name: 'links',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        lineStyle: {
          width: 1,
          opacity: 0.5
        },
        data: []
      },
      {
        name: 'Packets',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        effect: {
          show: true,
          trailColor: 'white',
          trailWidth: 2.5,
          trailOpacity: 0.8,
          trailLength: 0.25,
          // constantSpeed: 80
          period: 0.8
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.02,
          opacity: 0.05
        },
        data: []
      }
    ]
  }

  createNodes()

  function createNodes() {
    const rand = new SeededRandom(TopoConfig.seed)
    ASN.value = 0
    Packets.value = []

    // clear old nodes
    if (Nodes.value.length > 1) {
      for (const n of Nodes.value) {
        if (n.id > 0) {
          n.w.terminate()
        }
      }
    }
    Nodes.value = [<Node>{ id: 0, pos: [0, 0], joined: false, w: {}, neighbors: [] }] // placeholder

    for (let i = 1; i <= TopoConfig.num_nodes; i++) {
      const n: Node = {
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
      // assign id
      n.w.postMessage(<Message>{
        type: MSG_TYPES.INIT,
        payload: <MSG_INIT_PAYLOAD>{
          id: n.id,
          pos: n.pos,
          sch_config: JSON.parse(JSON.stringify(SchConfig))
        }
      })

      // handle messages and packets sent from each node
      n.w.onmessage = (e: any) => {
        // msg or pkt
        if ('ch' in e.data == false) {
          const msg: Message = e.data
          switch (msg.type) {
            case MSG_TYPES.STAT:
              break

            case MSG_TYPES.ASSOC_REQ: {
              // new node join
              // console.log(`new node join: ${msg.payload.id}->${msg.payload.parent}`)
              const new_node: number = msg.payload.id
              const parent: number = msg.payload.parent

              // to improve
              const topo_check = !Nodes.value[new_node].joined

              if (topo_check) {
                Nodes.value[new_node].joined = true

                Nodes.value[new_node].neighbors.push(parent)
                Nodes.value[parent].neighbors.push(new_node)

                option.series[0].data.push([Nodes.value[new_node].pos, Nodes.value[parent].pos])
                nextTick(() => {
                  chart.setOption(option)
                })
                Nodes.value[ADDR.ROOT].w.postMessage(<Packet>{
                  type: PKT_TYPES.ASSOC_RSP,
                  uid: Math.floor(Math.random() * 0xffff),
                  ch: 2,
                  src: 0,
                  dst: ADDR.ROOT,
                  seq: 0,
                  asn: ASN.value,
                  len: 7,
                  payload: <ASSOC_RSP_PAYLOAD>{
                    permit: true,
                    id: new_node,
                    parent: parent,
                    schedule: <Cell[]>[
                      {
                        type: CELL_TYPES.MGMT,
                        slot: msg.payload.id + 20,
                        ch: 1,
                        src: msg.payload.id,
                        dst: ADDR.BROADCAST
                      },
                      {
                        type: CELL_TYPES.DATA,
                        slot: msg.payload.id + 60,
                        ch: Math.floor(Math.random() * 4) + 2,
                        src: msg.payload.id,
                        dst: parent
                      }
                    ]
                  }
                })
              }
              break
            }
          }
        } else {
          const pkt: Packet = e.data
          // check channel interference, only one packet can be transmitted on each channel in a slot
          if (pkt.ch in channels) {
            channels[pkt.ch].push(pkt)
          } else {
            channels[pkt.ch] = [pkt]
          }
          if (channels[pkt.ch].length == 1 || pkt.type == PKT_TYPES.ACK) {
            // must use this format for the detailedView function of el-table-v2
            pkt.id = Packets.value.length
            pkt.children = [
              {
                id: `${Packets.value.length}-detail-content`,
                detail: JSON.stringify(pkt.payload).replace(/"/g, '')
              }
            ]
            Packets.value.push(pkt)

            // draw animation
            if (pkt.type != PKT_TYPES.ACK) {
              const srcPos = Nodes.value[pkt.src].pos
              const dstPos = pkt.dst == ADDR.BROADCAST ? srcPos : Nodes.value[pkt.dst].pos
              option.series[1].data.push([srcPos, dstPos])
              nextTick(() => {
                chart.setOption(option)
              })
            }
            if (pkt.dst == ADDR.BROADCAST) {
              for (const nn of Nodes.value) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (nn.id > 0 && nn.id != n.id && distance <= TopoConfig.tx_range) {
                  nn.w.postMessage(pkt)
                }
              }
            } else {
              const nn = Nodes.value[pkt.dst]
              if (nn != null) {
                // check if in tx_range
                const distance = Math.sqrt(
                  Math.pow(n.pos[0] - nn.pos[0], 2) + Math.pow(n.pos[1] - nn.pos[1], 2)
                )
                if (distance <= TopoConfig.tx_range) {
                  nn.w.postMessage(pkt)
                }
              }
            }
          }
        }
      }
    }
  }

  function drawNodes() {
    for (const n of Nodes.value) {
      if (n.id == 0) continue
      const center: Coordinate = n.pos // San Francisco, for example
      const radius = 60 // 10 kilometers
      const numSegments = 6 // The more segments, the smoother the circle

      const coordinates = generateCircleCoordinates(center, radius, numSegments)
      gridMap.features.push({
        type: 'Feature',
        properties: {
          id: n.id,
          name: n.id
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

  onMounted(() => {
    chart = echarts.init(chartDom.value, isDark.value ? 'dark' : 'macarons')
    drawNodes()
  })

  watch(ASN, () => {
    option.series[1].data = []
    nextTick(() => {
      chart.setOption(option)
    })
    if (Nodes.value.length > 1) {
      channels = {}
      for (let c = 1; c <= 8; c++) {
        channels[c] = []
      }
      for (const n of Nodes.value) {
        if (n.id > 0) {
          n.w.postMessage(<Packet>{
            type: MSG_TYPES.ASN,
            dst: n.id,
            payload: <MSG_ASN_PAYLOAD>{ asn: ASN.value }
          })
        }
      }
    }
  })

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

type Coordinate = [number, number]

function generateCircleCoordinates(
  center: Coordinate,
  radius: number,
  numSegments: number
): Coordinate[] {
  const distanceX = radius / (111.32 * Math.cos((center[1] * Math.PI) / 180))
  const distanceY = radius / 110.574

  const coordinates: Coordinate[] = []

  for (let i = 0; i < numSegments; i++) {
    const theta = (i / numSegments) * (2 * Math.PI)
    const dx = distanceX * Math.cos(theta)
    const dy = distanceY * Math.sin(theta)

    const point: Coordinate = [center[0] + dx, center[1] + dy]
    coordinates.push(point)
  }

  // To close the circle, add the first point again at the end
  coordinates.push(coordinates[0])

  return coordinates
}
