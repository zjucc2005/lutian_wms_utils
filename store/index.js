import config from '@/config'
import Snowflake from '@/utils/snowflake'
import permission from '@/utils/permission'

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
        config: config,            // 运行配置
        latest_version: 0,         // 最新版本号
        system_info: null,         // 设备信息，开机获取
        // #ifdef H5
        device_type: 'h5',
        // #endif
        // #ifdef APP-PLUS
        device_type: 'app-plus',
        // #endif
        conn_info: null,           // API连接成功返回数据
        conn_expired_at: null,     // API连接过期时间
        cur_stock: {},             // >>> 当前作业仓库
        cur_staff: {},             // >>> 当前作业员工
        role: '',                  // 用户角色，详见 permission.js
        process_version: 'v2',     // 流程版本
        snowflake: null,           // 雪花算法实例，全局运行一个实例      
        bd_stocks: [],             // 基础数据，仓库，bd_开头的数据均采用api获取时的状态，不做数据处理
        bd_stock_opts: [],         // 基础数据，仓库，uni-data-picker 用格式
        bd_materialcategories: [], // 基础数据，存货类别
        stock_locs: [],            // 基础数据，库位，登录时获取，在库位管理处可重新获取（刷新）
        stock_loc_opts: [],        // 基础数据，库位，uni-data-picker 用格式
        document_status_dict: { A: '已创建', B: '已提交', C: '已审核' },
        goods_nav_fill: true,
        goods_nav_color: {
            blue: 'linear-gradient(90deg, #1E83FF, #0053B8)',
            green: 'linear-gradient(90deg, #4cd964, #42b983)',
            yellow: 'linear-gradient(90deg, #FFCD1E, #FF8A18)',
            red: 'linear-gradient(90deg, #FE6035, #EF1224)',
            grey: 'linear-gradient(90deg, #AAA, #606266)'
        },
        drawer_width: 320,         // drawer 全局宽度，根据窗口尺寸计算
    },
    mutations: {
        api_conn(state, conn_info, duration) {
            state.conn_info = conn_info
            state.conn_expired_at = Date.now() + 600 * 1000
        },
        // reset_api_conn(state, duration = 0) {
        //     state.conn_expired_at = Date.now() + duration
        // },
        staff_login(state, params) {
            state.cur_stock = params.stock
            state.cur_staff = params.staff
            uni.setStorageSync('cur_stock', params.stock)
            uni.setStorageSync('cur_staff', params.staff)
            state.role = permission.get_system_role(params.staff.FOperatorGroup) // 设定角色
            // 初始化时, 自动生成序列号
            // 设备id采用登录员工的员工编号，编号一般有5位数字，最大支持到1048576；只支持数字字符；
            let device_id = params.staff.FNumber ? params.staff.FNumber.match(/(\d+)/)[0] : params.staff.FNumber
            state.snowflake = new Snowflake(device_id)
        },
        staff_logout(state) {
            if (state.role == 'guest') {
                state.cur_stock = uni.getStorageSync('cur_stock') // 退出重载
                state.cur_staff = uni.getStorageSync('cur_staff')
            } else {
                state.cur_staff = { FName: state.cur_staff.FName }  // 退出保留上一次登录的员工姓名
                uni.setStorageSync('cur_staff', { FName: state.cur_staff.FName })
            }
        },
        guest_login(state, params) {
            state.cur_stock = params.stock
            state.cur_staff = { FName: '访客', FNumber: 'GUEST' }
            state.role = 'guest'
            state.snowflake = new Snowflake(0)
        },
        // set_env(state, env) {
        //     state.env = env
        // },
        set_latest_version(state, version) {
            state.latest_version = version
        },
        set_system_info(state, system_info) {
            state.system_info = system_info
            state.drawer_width = system_info.windowWidth * 0.88
        },
        set_bd_stocks(state, bd_stocks) {
            state.bd_stocks = bd_stocks
            let stock_opts = []
            for (let d of bd_stocks) {
                if (d.FDocumentStatus != 'C' || d.FForbidStatus != 'A') continue
                let org = stock_opts.find(opt => opt.value === d.FUseOrgId)
                if (!org) {
                    org = { text: d['FUseOrgId.FName'], value: d.FUseOrgId, children: [] }
                    stock_opts.push(org)
                }
                // DEBUG: data-picker 会扁平化数据，再去查找父级，父级value相同时数据会乱, group.value重新组装以保证唯一性
                let group_value = [d.FUseOrgId, d.FGroup].join(',')
                let group = org.children.find(x => x.value == group_value)
                if (!group) {
                    group = { text: d['FGroup.FName'] || '未分组', value: group_value, children: [] }
                    org.children.push(group)
                }
                group.children.push({ text: d.FName, value: d.FStockId })
            }
            stock_opts.sort((x, y) => x.value - y.value) // 按组织编号排序
            state.bd_stock_opts = stock_opts
        },
        set_bd_materialcategories(state, bd_materialcategories) {
            state.bd_materialcategories = bd_materialcategories
        },
        set_stock_locs(state, stock_locs) {
            state.stock_locs = stock_locs
            const stock_loc_opts = []
            stock_locs.forEach(stock_loc => {
                let loc_no = stock_loc.FNumber
                let loc_no_arr = loc_no.split('-')
                let depot = stock_loc_opts.find(opt => opt.text == loc_no_arr[0])
                if (!depot) {
                    depot = { text: loc_no_arr[0], value: loc_no_arr[0], children: [] }
                    stock_loc_opts.push(depot)
                }
                if (loc_no_arr.length > 1) {
                    let shelf = depot.children.find(s => s.text == loc_no_arr[1])
                    if (!shelf) {
                        shelf = { text: loc_no_arr[1], value: loc_no_arr.slice(0, 2).join('-'), children: [] }
                        depot.children.push(shelf)
                    }
                    if (loc_no_arr.length > 2) {
                        shelf.children.push({ text: loc_no_arr.slice(2).join('-'), value: loc_no })
                    }
                }                   
            })
            stock_loc_opts.forEach(depot => {
                depot.children.sort((x, y) => x.text >= y.text ? 1 : -1)
                depot.children.forEach(shelf => {
                    shelf.children.sort((x, y) => x.text >= y.text ? 1 : -1)
                })
            })
            state.stock_loc_opts = stock_loc_opts
        },
        // 更新库位状态
        update_stock_locs(state, patch_stock_locs) {
            for (let stock_loc of state.stock_locs) {
                stock_loc.FDocumentStatus = 'C'
                stock_loc.FForbidStatus = 'A'
                for (let item of patch_stock_locs) {
                    if (stock_loc.FNumber == item.FNumber) {
                        stock_loc.FDocumentStatus = item.FDocumentStatus
                        stock_loc.FForbidStatus = item.FForbidStatus
                    }
                }
            }

        }
    },
    getters: {
        
    },
    actions: {

    }
})

export default store
