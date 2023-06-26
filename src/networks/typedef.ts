export interface NodeMeta {
  id: number
  type: number
  pos: number[]
  neighbors: number[]
  queueLen: number
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}

export enum NODE_TYPE {
  FiveG,
  TSCH,
  TSN
}
