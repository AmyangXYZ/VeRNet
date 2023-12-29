export class KDNode {
  id: number
  pos: [number, number]
  left: KDNode | undefined
  right: KDNode | undefined
  constructor(id: number, pos: [number, number]) {
    this.id = id
    this.pos = pos
    this.left = undefined
    this.right = undefined
  }
}

export class KDTree {
  root: KDNode | undefined
  constructor() {
    this.root = undefined
  }

  Insert(node: KDNode): void {
    this.root = this._insertRecur(this.root, node, 0)
  }
  private _insertRecur(current: KDNode | undefined, node: KDNode, depth: number): KDNode {
    if (current == undefined) {
      return node
    }
    const cd = depth % 2 // two dimension only
    if (node.pos[cd] < current.pos[cd]) {
      current.left = this._insertRecur(current.left, node, depth + 1)
    } else {
      current.right = this._insertRecur(current.right, node, depth + 1)
    }
    return current
  }

  FindKNearest(pos: [number, number], k: number, range: number): number[] {
    const nearestNodes: KDNode[] = []
    this._findKNearestRecur(this.root, pos, 0, k, range * range, nearestNodes)
    return nearestNodes.map(({ id }) => id)
  }
  private _findKNearestRecur(
    current: KDNode | undefined,
    pos: [number, number],
    depth: number,
    k: number,
    range: number,
    nearestNodes: KDNode[]
  ): void {
    if (current == undefined) return

    const d = this._distanceSquared(current.pos, pos)
    if (current.pos != pos && d <= range) {
      if (nearestNodes.length < k) {
        nearestNodes.push(current)
      } else if (d < this._distanceSquared(pos, nearestNodes[k - 1].pos)) {
        nearestNodes[k - 1] = current
      }
      nearestNodes.sort(
        (a: KDNode, b: KDNode) =>
          this._distanceSquared(pos, a.pos) - this._distanceSquared(pos, b.pos)
      )
    }

    const cd = depth % 2
    const diff = pos[cd] - current.pos[cd]
    const closer = diff < 0 ? current.left : current.right
    const farther = diff < 0 ? current.right : current.left
    this._findKNearestRecur(closer, pos, depth + 1, k, range, nearestNodes)

    if (
      diff * diff <= range &&
      (nearestNodes.length < k || diff * diff < this._distanceSquared(pos, nearestNodes[k - 1].pos))
    ) {
      this._findKNearestRecur(farther, pos, depth + 1, k, range, nearestNodes)
    }
  }

  private _distanceSquared(v1: [number, number], v2: [number, number]): number {
    const dx = v2[0] - v1[0]
    const dy = v2[1] - v1[1]
    return dx * dx + dy * dy
  }
}
