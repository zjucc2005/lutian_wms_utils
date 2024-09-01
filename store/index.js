// #ifndef VUE3
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
// #endif

// #ifdef VUE3
import { createStore } from 'vuex'
const store = createStore({
// #endif
    state: {
                                   // >>> 表示本地持久化
        system_info: null,         // 设备信息，开机获取
        conn_info: null,           // API连接成功返回数据
        conn_expired_at: null,     // API连接过期时间
        cur_stock: {},             // >>> 当前作业仓库
        cur_staff: {},             // >>> 当前作业员工
        cur_inbound_task: {},      // 当前入库任务        
        bd_stocks: [],             // 基础数据，仓库，bd_开头的数据均采用api获取时的状态，不做数据处理
        bd_materials: [],          // 基础数据，物料
        bd_units: [],              // >>> 基础数据，计量单位，storage
        task_outbound: {},         // 出库任务
        task_transfer: {}
    },
    mutations: {
        api_conn(state, conn_info) {
            state.conn_info = conn_info
            store.commit('reset_api_conn')
        },
        reset_api_conn(state) {
            state.conn_expired_at = Date.now() + 20 * 60 * 1000 // 20分钟
        },
        staff_login(state, params) {
            state.cur_stock = params.stock
            state.cur_staff = params.staff
            uni.setStorageSync('cur_stock', params.stock)
            uni.setStorageSync('cur_staff', { FName: params.staff.FName })
        },
        staff_logout(state) {
            state.cur_staff = { FName: state.cur_staff.FName }  // 退出保留上一次登录的员工姓名
        },
        set_cur_inbound_task(state, inbound_task) {
            state.cur_inbound_task = inbound_task
        },
        set_system_info(state, system_info) {
            state.system_info = system_info
        },      
        set_bd_stocks(state, bd_stocks) {
            state.bd_stocks = bd_stocks
        },
        append_bd_material(state, bd_material) {
            state.bd_materials.push(bd_material)
        },
        set_bd_units(state, bd_units) {
            state.bd_units = bd_units
        }
    },
    getters: {
        
    },
    actions: {

    }
})

export default store
