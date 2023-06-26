class TSNSwitch {
  id: number = 0
  ports: { [p: number]: number } = {}
  constructor() {}

  Run() {
    console.log(this.id)
  }
}

new TSNSwitch().Run()
