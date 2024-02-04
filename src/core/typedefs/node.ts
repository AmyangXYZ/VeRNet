export enum NODE_TYPE {
  TSCH,
  TSN,
  FIVE_G_GNB,
  FIVE_G_UE,
  END_SYSTEM_SERVER = 11,
  END_SYSTEM_SENSOR_CAMERA,
  END_SYSTEM_SENSOR_TEMP,
  END_SYSTEM_SENSOR_PRESSURE,
  END_SYSTEM_SENSOR_HUMIDITY,
  END_SYSTEM_ACTUATOR_ROBOTIC_ARM,
  END_SYSTEM_ACTUATOR_PNEUMATIC
}

export const NODE_TYPE_DISPLAY_NAME = <{ [name: string]: string }>{
  [NODE_TYPE.TSCH]: 'TSCH Node',
  [NODE_TYPE.TSN]: 'TSN Bridge',
  [NODE_TYPE.FIVE_G_GNB]: '5G gNB',
  [NODE_TYPE.FIVE_G_UE]: '5G UE',
  [NODE_TYPE.END_SYSTEM_SERVER]: 'Edge Server',
  [NODE_TYPE.END_SYSTEM_SENSOR_CAMERA]: 'Camera',
  [NODE_TYPE.END_SYSTEM_SENSOR_TEMP]: 'Temperature Sensor',
  [NODE_TYPE.END_SYSTEM_SENSOR_PRESSURE]: 'Pressure Sensor',
  [NODE_TYPE.END_SYSTEM_SENSOR_HUMIDITY]: 'Humidity Sensor',
  [NODE_TYPE.END_SYSTEM_ACTUATOR_ROBOTIC_ARM]: 'Robotic Arm',
  [NODE_TYPE.END_SYSTEM_ACTUATOR_PNEUMATIC]: 'Pneumatic Actuator'
}

export interface Node {
  id: number
  type: number
  pos: [number, number]
  neighbors: number[]
  w: Worker | undefined
}
