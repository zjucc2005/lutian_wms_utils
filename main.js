import App from './App'
import store from '@/store'
import logger from '@/utils/logger'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
Vue.prototype.$store = store
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.mixin({
    onShow() {
      // #ifdef APP-PLUS
      let main = plus.android.runtimeMainActivity()
      main.unregisterReceiver(store.state.broadcast_receiver) // 注销广播
      // #endif
    }
  })
  app.config.globalProperties.$logger = logger
  return {
    app
  }
}
// #endif