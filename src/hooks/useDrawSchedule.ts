// import * as echarts from 'echarts'
// import 'echarts-gl'

// import { Network } from './useStates'

// export function useDrawSchedule3D(chartDom: HTMLElement): any {
//   const chart = echarts.init(chartDom)

//   const zCategories = ['Shared', 'Mgmt', 'Data']

//   const option: any = {
//     dataset: {
//       dimensions: ['slot', 'channel', 'type'],
//       source: []
//     },
//     yAxis3D: {
//       type: 'category',
//       name: 'Channels',
//       nameTextStyle: {
//         color: 'white'
//       },
//       data: Array.from({ length: Network.SchConfig.value.num_slots }, (_, i) => i + 1),
//       axisTick: {
//         interval: 1
//       },
//       axisLabel: {
//         color: 'white'
//       },
//       min: 0,
//       max: 10
//     },
//     xAxis3D: {
//       type: 'category',
//       name: 'Slots',
//       nameTextStyle: {
//         color: 'white'
//       },
//       data: Array.from({ length: Network.SchConfig.value.num_channels }, (_, i) => i + 1),
//       axisTick: {
//         interval: 1
//       },
//       axisLabel: {
//         color: 'white'
//       },
//       min: 0,
//       max: 20
//     },
//     zAxis3D: {
//       type: 'category',
//       data: zCategories,
//       axisTick: {
//         interval: 1
//       },
//       axisLabel: {
//         color: 'white'
//       },
//       min: 0,
//       max: 2
//     },
//     grid3D: {
//       light: {
//         main: {
//           shadow: true,
//           quality: 'ultra',
//           intensity: 1.5
//         }
//       },
//       borderColor: 'white'
//     },
//     series: [
//       {
//         type: 'bar3D',

//         xAxisIndex: 0,
//         yAxisIndex: 0,
//         zAxisIndex: 0,

//         seriesIndex: 0,
//         itemStyle: {
//           depth: 20,
//           height: 20
//         },
//         encode: {
//           x: 'slot',
//           y: 'channel',
//           z: {
//             field: 'type',
//             ordinal: 'true'
//           },
//           color: 'color'
//         }
//       }
//     ],
//     responsive: true
//   }

//   chart.setOption(option)
// }
