import './assets/main.css'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'

import 'vuesax3/dist/vuesax.css'

import './utils/seedrandom.min.js'
// Math.seedrandom('123')

const app = createApp(App)

app.use(router)
app.use(ElementPlus)
app.mount('#app')
