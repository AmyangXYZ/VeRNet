export * from './config'
export * from './node'
export * from './message'
export * from './packet'
export * from './link'
export * from './routing'
export * from './flow'
export * from './schedule'

export const PROTOCOL_TYPE = <{ [name: string]: string }>{
  TSCH: '802.15.4',
  TSN: '802.1',
  FIVE_G: '5G NR'
}
