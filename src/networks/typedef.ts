export interface NodeMeta {
  id: number
  pos: number[]
  neighbors: number[]
  queueLen: number
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}
