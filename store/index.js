import Snowflake from '@/utils/snowflake'

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
        snowflake: null,           // 雪花算法实例，全局运行一个实例      
        bd_stocks: [],             // 基础数据，仓库，bd_开头的数据均采用api获取时的状态，不做数据处理
        stock_locs: [],            // 基础数据，库位，登录时获取，在库位管理处可重新获取（刷新）
        bd_materials: []           // 基础数据，物料
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
            // uni.setStorageSync('cur_staff', { FName: params.staff.FName })
            uni.setStorageSync('cur_staff', params.staff)
            // 初始化时, 自动生成序列号
            // 设备id采用登录员工的员工编号，编号一般有5位数字，最大支持到1048576；
            state.snowflake = new Snowflake(params.staff.FNumber)
        },
        staff_logout(state) {
            state.cur_staff = { FName: state.cur_staff.FName }  // 退出保留上一次登录的员工姓名
        },
        set_system_info(state, system_info) {
            state.system_info = system_info
        },
        set_bd_stocks(state, bd_stocks) {
            state.bd_stocks = bd_stocks
        },
        set_stock_locs(state, stock_locs) {
            state.stock_locs = stock_locs
        }
    },
    getters: {
        
    },
    actions: {

    }
})

export default store
