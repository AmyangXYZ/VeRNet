export interface NodeStats {
  rx_cnt: number
  tx_cnt: number
  queue_len: number
  queue_head: number // packet uid
}
