import * as echarts from 'echarts'
import 'echarts-gl'

import { Network } from './useStates'

import { CELL_TYPES } from '@/networks/TSCH/typedefs'

export function useDrawSchedule3D(chartDom: HTMLElement): any {
    const chart = echarts.init(chartDom)

    const option: any = {
        dataset: {
            dimensions: ['slot', 'channel', 'type'],
            source: []
        },
        xAxis3D: {
            type: 'category',
            data: Array.from({length: Network.SchConfig.value.num_slots}, (_, i) => i + 1),
            axisTick: {
                interval: 0
            },
            min: 0,
            max: 10
        },
        yAxis3D: {
            type: 'category',
            data: Array.from({length: Network.SchConfig.value.num_channels}, (_, i) => i + 1),
            axisTick: {
                interval: 0
            },
            min: 0,
            max: 10
        },
        zAxis3D: {
            type: 'category',
            data: [CELL_TYPES.SHARED, CELL_TYPES.MGMT, CELL_TYPES.DATA],
            min: 0,
            max: 2
        },
        grid3D: {
            boxWidth: 100,
            boxDepth: 100,
            boxHeight: 80,
            axisPointer: {
                show: false
            },
            viewControl: {
                alpha: 50,
                distance: 200,
                rotateSensitivity: 1,
                zoomSensitivity: 1
            }
        },
        series: [{
            type: 'bar3D',
            
            xAxisIndex: 0,
            yAxisIndex: 0,
            zAxisIndex: 0,

            seriesIndex: 0,
            itemStyle: {
                depth: 20
            },
            encode: {
                x: 'slot',
                y: 'channel',
                z: { field: 'type', ordinal: 'true' }
            }
        }]
    }

    for (let slot = 1; slot <= Network.SchConfig.value.num_slots; slot++) {
        for (let channel = 1; channel <= Network.SchConfig.value.num_channels; channel++) {
            const cell = Network.Schedule.value[slot][channel]
            if (cell) {
                option.dataset.source.push({
                    slot: `${slot}`,
                    channel: `${channel}`,
                    type: cell.type
                })
            }
        }
    }
    console.log(option.dataset.source)

    chart.setOption(option)
    chart.resize()
}