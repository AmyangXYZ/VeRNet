export interface Flow {
  id: number
  e2e_src: number
  e2e_dst: number
  deadline: number
  period: number
  workload: number
  path: number[] // id's of all nodes in path
  editing: boolean // whether or not the user can edit in FlowsPanel
}
