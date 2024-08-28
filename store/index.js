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
        conn_info: null,           // API连接成功返回数据
        conn_expired_at: null,     // API连接过期时间
        cur_depot: {},             // 当前作业仓库
        cur_staff: {},             // 当前作业员工
        bd_depot_opts: [],         // 基础数据，仓库选项，登录用
        bd_depots: [],             // 基础数据，仓库
        bd_materials: [],          // 基础数据，物料
        bd_units: [],              // 基础数据，计量单位，storage
        task_inbound: {},          // 入库任务
        task_outbound: {},         // 出库任务
        task_transfer: {},
    },
    mutations: {
        api_conn(state, user_info) {
            state.user_info = user_info
            store.commit('reset_api_conn')
        },
        reset_api_conn(state) {
            state.conn_expired_at = Date.now() + 20 * 60 * 1000 // 20分钟
        },
        staff_login(state, params) {
            state.cur_depot = params.depot
            state.cur_staff = params.staff
            uni.setStorageSync('cur_depot', params.depot)
            uni.setStorageSync('cur_staff', { FName: params.staff.FName })
        },
        staff_logout(state) {
            state.cur_staff = { FName: state.cur_staff.FName }  // 退出保留上一次登录的员工姓名
        },
        set_bd_depot_opts(state, bd_depot_opts) {
            state.bd_depot_opts = bd_depot_opts
        },
        append_bd_material(state, bd_material) {
            state.bd_materials.push(bd_material)
        },
        set_bd_units(state, bd_units) {
            state.bd_units = bd_units
            uni.setStorageSync('bd_units', bd_units)
        }
    },
    getters: {
        
    },
    actions: {

    }
})

export default store
