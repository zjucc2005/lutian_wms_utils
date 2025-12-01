<template>
    <uni-list v-if="invs.length">
        <uni-list-item
            :show-extra-icon="true"
            :extra-icon="{ type: 'info',  color: '#007bff', size: 23 }"
            title="库存总数"
            :rightText="`${sum_qty}`"
            >
        </uni-list-item>
        <uni-list-item
            v-if="!onlyInv"
            :show-extra-icon="true"
            :extra-icon="{ type: 'info',  color: '#007bff', size: 23 }"
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">库位总数（货架）</view>
                </view>
                <view class="uni-list-item__foot">
                    <view>
                        {{ loc_qty.total }} (
                        <uni-icons type="smallcircle-filled" size="18" color="#67c23a"></uni-icons> {{ loc_qty.used }}
                        <uni-icons type="smallcircle-filled" size="18" color="#f56c6c"></uni-icons> {{ loc_qty.disabled }}
                        <uni-icons type="smallcircle-filled" size="18" color="#c0c0c0"></uni-icons> {{ loc_qty.idle }}
                        ) 
                    </view>
                </view>
            </template>
        </uni-list-item>
    </uni-list>
    <uni-collapse :accordion="accordion">
        <uni-collapse-item
            v-for="(shelf, index) in grid_shelves" :key="index"
            :title="shelf.name" :open="accordion ? index === 0 : open" title-border="show">
            <template #title>
                <view class="collapse_header" style="">
                    <view class="shelf_name" style="padding: 15px;">
                        {{ shelf.name }}
                    </view>
                    <view class="shelf_tips" v-if="!onlyInv && invs.length">
                        库位数 {{ shelf.loc_qty.total }} （
                        <uni-icons type="smallcircle-filled" size="18" color="#67c23a"></uni-icons> {{ shelf.loc_qty.used }}
                        <uni-icons type="smallcircle-filled" size="18" color="#f56c6c"></uni-icons> {{ shelf.loc_qty.disabled }}
                        <uni-icons type="smallcircle-filled" size="18" color="#c0c0c0"></uni-icons> {{ shelf.loc_qty.idle }}
                        ）
                    </view>
                </view>
            </template>
            <view class="content">
                <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                    <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                        <uni-grid 
                            :column="column" 
                            :show-border="false" 
                            @change="grid_click($event, shelf)"
                            :style="{
                                width: grid_group_width + 'px'
                            }"
                            >
                            <uni-grid-item
                                v-for="grid in filter_swiper_grids(shelf, page)"
                                :key="grid.index"
                                :index="grid.index"
                                :style="{
                                    width: grid_width + 'px',
                                    height: grid_width + 'px'
                                }"
                                >
                                <view :class="['grid-item-box', grid.style]">
                                    <view class="name">{{ grid.name }}</view>
                                    <view v-if="grid.qty" class="qty">{{ grid.qty > 99999 ? '99999+' : grid.qty }}</view>
                                </view>
                            </uni-grid-item>
                        </uni-grid>
                    </swiper-item>
                </swiper>
            </view>
        </uni-collapse-item>
    </uni-collapse>
    
    <uni-drawer ref="inv_drawer" mode="left" :width="$store.state.drawer_width" >
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="`库位：${drawer_stock_loc.FNumber}`"
                :sub-title="drawer_stock_loc.FRemark ? `备注：${drawer_stock_loc.FRemark}` : ''"
                type="square">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="drawer_close"/>
                    </view>
                </template>
                <template v-if="forbidable">
                    <button v-if="drawer_stock_loc.FForbidStatus == 'A'"
                        type="warn" style="border-radius: 0;" 
                        @click="stock_loc_forbid(drawer_stock_loc.FNumber)">
                        库位报警
                    </button>
                    
                    <button v-if="drawer_stock_loc.FForbidStatus == 'B'" 
                        type="primary" style="border-radius: 0;" 
                        @click="stock_loc_enable(drawer_stock_loc.FNumber)">
                        解除库位报警
                    </button>
                </template>
                
                <uni-list>
                    <uni-list-item
                        v-for="(inv, index) in invs.filter(x => x['FStockLocId.FNumber'] == drawer_stock_loc.FNumber)" :key="index"
                        @click="inv_menu(inv)" clickable>
                        <template #body>
                            <view class="uni-list-item__body">
                                <text class="title">{{ inv['FMaterialId.FNumber'] }}</text>
                                <view class="note">
                                    <view>名称：{{ inv['FMaterialId.FName'] }}</view>
                                    <view>规格：{{ inv['FMaterialId.FSpecification'] }}</view>
                                    <view>批次：{{ inv.FBatchNo }}</view>
                                    <view>供应商：{{ inv['FSupplierId.FName'] }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view>{{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}</view>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
</template>

<script>
    /**
     * cc-shelf 网格化库位展示
     * @property {Array} stock_locs 库位数据
     * @property {Array} invs 库存数据
     * @property {Number} cols grid 固定列数
     * @property {Boolean} onlyInv = [true|false] 是否只展示有库存的货架
     * @property {Boolean} open = [true|false] 是否展开组件
     * @event {Function} click 点击 grid 触发事件
     * @example <cc-shelf :stock_locs="[]" :invs="[{...}]" open></cc-shelf>
     */
    
    import store from '@/store'
    import { link_to } from '@/utils'
    import { StockLoc } from '@/utils/model'
    export default {
        name:"cc-shelf",
        // emits: ['click'],
        props: {
            stock_locs: {
                type: Array,
                default: []
            },
            invs: {
                type: Array,
                default: []
            },
            cols: {
                type: Number,
                default: 0,
            },
            onlyInv: {
                type: Boolean,
                default: false
            },
            open: {
                type: Boolean,
                default: false
            },
            forbidable: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                grid_group_width: 0, // 设定 grid wrapper 宽度，在界面缩放后能保持原布局不乱
                // grid_width: 0,       // 设定 grid 宽度，改为动态计算computed
                drawer_loc_no: '',
                accordion: uni.getStorageSync('shelf_accordion') === 'y'
            }
        },
        mounted() {
        },
        computed: {
            column () {
                if (this.cols) return this.cols
                let res = Math.floor(store.state.system_info.windowWidth / 48)
                if (res < 10) res = 10
                // if (res > 36) res = 36
                return res
            },
            grid_width() {
                let screen_width = store.state.system_info.windowWidth
                this.grid_group_width = screen_width
                return (screen_width - 1) / this.column
            },
            sum_qty() {
                let sum = 0
                for (let inv of this.invs) {
                    sum += inv.FQty
                }
                return sum
            },
            loc_qty() {
                let res = { total: 0, used: 0, idle: 0, disabled: 0 }
                this.grid_shelves.forEach(shelf => {
                    if (!shelf.sp) {
                        res.total += shelf.loc_qty.total
                        res.used += shelf.loc_qty.used
                        res.idle += shelf.loc_qty.idle
                        res.disabled += shelf.loc_qty.disabled
                    }
                })
                return res
            },
            grid_shelves() {
                let grid_shelves = []
                for (let stock_loc of this.stock_locs) {
                    let no = stock_loc.FNumber                // 编码
                    let shelf = stock_loc.FGroup              // 货架/分组
                    let name = no                             // 组内名称简称
                    if (no.startsWith(shelf)) {
                        name = no.substring(shelf.length, no.length)
                        if (name.startsWith('-')) name = name.substring(1, name.length)
                    }
                    let x = stock_loc.FPosX                   // 横坐标
                    let y = stock_loc.FPosY                   // 纵坐标
                    let status = ''                           // 状态
                    let style = 'default'                     // 样式
                    let qty = 0                               // 库存数
                    if (stock_loc.FForbidStatus == 'B') {
                        status = 'forbidden'
                        style = 'error'
                    }
                    let grid_shelf = grid_shelves.find(s => s.name === stock_loc.FGroup)
                    if (grid_shelf) {
                        grid_shelf.bound.x = Math.max(grid_shelf.bound.x, stock_loc.FPosX)
                        grid_shelf.bound.y = Math.max(grid_shelf.bound.y, stock_loc.FPosY)
                        grid_shelf.grids.push({ no, shelf, name, x, y, status, style, qty })
                    } else {
                        grid_shelves.push({
                            name: shelf,
                            disabled: true,
                            bound: { x, y },
                            loc_qty: { total: 0, used: 0, idle: 0, disabled: 0 },
                            grids: [{ no, shelf, name, x, y, status, style, qty }]
                        })
                    }
                }
                // 判断库存状态
                this.invs.forEach(inv => {
                    let shelf = grid_shelves.find(s => s.name == inv['FStockLocId.FGroup'])
                    if (shelf) {
                        shelf.disabled = false
                        let grid = shelf.grids.find(g => g.no == inv['FStockLocId.FNumber'])
                        if (grid.status == '') grid.style = 'success'
                        grid.qty += inv.FQty
                    }
                })
                // 汇总每个货架库位数
                grid_shelves.forEach(shelf => {
                    shelf.grids.forEach(grid => {
                        shelf.loc_qty.total += 1
                        if (grid.style == 'error') {
                            shelf.loc_qty.disabled += 1
                        } else if (grid.style == 'success') {
                            shelf.loc_qty.used += 1
                        } else {
                            shelf.loc_qty.idle += 1
                        }
                    })
                })
                // 补全空缺的grid并赋予page + index
                grid_shelves.forEach(shelf => {
                    for(let x=1;x<=Math.ceil(shelf.bound.x/this.column)*this.column;x+=1) {
                        for(let y=1;y<=shelf.bound.y;y+=1) {
                            let { page, index } = this.get_grid_page_and_index(shelf.bound, { x, y })
                            let name = this.get_grid_name({x, y})
                            let no = [shelf.name, name].join('-')
                            let grid = shelf.grids.find(g => g.x == x && g.y == y)
                            if (grid) {
                                grid.page = page
                                grid.index = index
                                grid.no = grid.no || no
                            } else {
                                grid = { x, y, page, index, name, no, qty: 0, status: '', style: 'none' }
                                shelf.grids.push(grid)
                            }
                        }
                    }
                })
                grid_shelves.sort((x, y) => x.name >= y.name ? 1 : -1)
                if (this.onlyInv) {
                    return grid_shelves.filter(shelf => !shelf.disabled)
                } else {
                    return grid_shelves
                }
            }
            // ,
            // grid_shelves_old() {
            //     let grid_shelves = []
            //     this.stock_locs.forEach(stock_loc => {
            //         if (this.is_loc_no_std_format(stock_loc.FNumber)) {
            //             // 标准库位
            //             let loc_no_arr = stock_loc.FNumber.split('-')
            //             let name = loc_no_arr.slice(0,2).join('-')
            //             let x = loc_no_arr[2].slice(1,3) * 1
            //             let y = loc_no_arr[2][0] * 1
            //             let status = ''
            //             let style = 'default'
            //             if (stock_loc.FForbidStatus == 'B') {
            //                 status = 'forbidden'
            //                 style = 'error'
            //             }
            //             let shelf = grid_shelves.find(s => s.name == name)
            //             if (shelf) {
            //                 shelf.bound.x = Math.max(shelf.bound.x, x)
            //                 shelf.bound.y = Math.max(shelf.bound.y, y)
            //                 shelf.grids.push({ x, y, status, style, no: stock_loc.FNumber, name: loc_no_arr[2], qty: 0 })
            //             } else {
            //                 grid_shelves.push({
            //                     name: name,
            //                     disabled: true,
            //                     bound: { x, y },
            //                     loc_qty: { total: 0, used: 0, idle: 0, disabled: 0 },
            //                     grids: [{ x, y, status, style, sp: false, no: stock_loc.FNumber, name: loc_no_arr[2], qty: 0 }]
            //                 })
            //             }
            //         } else if (this.is_loc_no_std_sp_format(stock_loc.FNumber)) {
            //             // 特殊库位，库区地面连续编号
            //             let loc_no_arr = stock_loc.FNumber.split('-')
            //             let name = [loc_no_arr[0], loc_no_arr[1][0]].join('-')
            //             let x = loc_no_arr[1].slice(1,3) * 1
            //             let y = 1
            //             let status = ''
            //             let style = 'default'
            //             if (stock_loc.FForbidStatus == 'B') {
            //                 status = 'forbidden'
            //                 style = 'error'
            //             }
            //             let shelf = grid_shelves.find(s => s.name == name)
            //             if (shelf) {
            //                 shelf.bound.x = Math.max(shelf.bound.x, x)
            //                 shelf.bound.y = Math.max(shelf.bound.y, y)
            //                 shelf.grids.push({ x, y, status, style, no: stock_loc.FNumber, name: loc_no_arr[1], qty: 0 })
            //             } else {
            //                 grid_shelves.push({
            //                     name: name,
            //                     disabled: true,
            //                     bound: { x, y },
            //                     sp: true,
            //                     loc_qty: { total: 0, used: 0, idle: 0, disabled: 0 },
            //                     grids: [{ x, y, status, style, sp: true, no: stock_loc.FNumber, name: loc_no_arr[1], qty: 0 }]
            //                 })
            //             }
            //         } else {
            //             // 特殊库位，未分组/独立库位处理
            //             let shelf = {
            //                 name: stock_loc.FNumber,
            //                 disabled: true,
            //                 bound: { x: 1, y: 1 },
            //                 sp: true,
            //                 loc_qty: { total: 0, used: 0, disabled: 0, idle: 0 },
            //                 grids:[{
            //                     x: 1, y: 1, 
            //                     status: stock_loc.FForbidStatus == 'B' ? 'forbidden' : '', 
            //                     style: stock_loc.FForbidStatus == 'B' ? 'error' : 'default', 
            //                     sp: true, no: stock_loc.FNumber,  qty: 0,
            //                 }]
            //             }
            //             grid_shelves.push(shelf)
            //         }
            //     })
            //     // 判断库存状态
            //     this.invs.forEach(inv => {
            //         // let loc_no_arr = inv['FStockLocId.FNumber'].split('-')
            //         let shelf_name = inv['FStockLocId.FNumber'].split('-').slice(0,2).join('-')
            //         if (this.is_loc_no_std_sp_format(inv['FStockLocId.FNumber'])) {
            //             let loc_no_arr = inv['FStockLocId.FNumber'].split('-')
            //             shelf_name = [loc_no_arr[0], loc_no_arr[1][0]].join('-')
            //         }
            //         let shelf = grid_shelves.find(s => s.name == shelf_name)
            //         if (shelf) {
            //             shelf.disabled = false
            //             let grid = shelf.grids.find(g => g.no == inv['FStockLocId.FNumber'])
            //             if (grid.status == '') {
            //                 grid.style = 'success'
            //             }
            //             grid.qty += inv.FQty
            //         }
            //     })
            //     // 汇总每个货架库位数
            //     grid_shelves.forEach(shelf => {
            //         shelf.grids.forEach(grid => {
            //             shelf.loc_qty.total += 1
            //             if (grid.style == 'error') {
            //                 shelf.loc_qty.disabled += 1
            //             } else if (grid.style == 'success') {
            //                 shelf.loc_qty.used += 1
            //             } else {
            //                 shelf.loc_qty.idle += 1
            //             }
            //         })
            //     })
                
            //     // 补全空缺的grid并赋予page + index
            //     grid_shelves.forEach(shelf => {
            //         for(let x=1;x<=Math.ceil(shelf.bound.x/this.column)*this.column;x+=1) {
            //             for(let y=1;y<=shelf.bound.y;y+=1) {
            //                 let { page, index } = this.get_grid_page_and_index(shelf.bound, { x, y })
            //                 let name = this.get_grid_name({x, y})
            //                 let no = [shelf.name, name].join('-')
            //                 let grid = shelf.grids.find(g => g.x == x && g.y == y)
            //                 if (grid) {
            //                     grid.page = page
            //                     grid.index = index
            //                     // grid.name = grid.sp ? '' : name
            //                     grid.no = grid.no || no
            //                 } else {
            //                     grid = { x, y, page, index, name, no, qty: 0, status: '', style: x > shelf.bound.x ? 'none' : 'default' }
            //                     shelf.grids.push(grid)
            //                 }
            //             }
            //         }
            //     })
            //     grid_shelves.sort((x, y) => x.name >= y.name ? 1 : -1)
                
            //     if (this.onlyInv) {
            //         return grid_shelves.filter(shelf => !shelf.disabled)
            //     } else {
            //         return grid_shelves
            //     }
            // }
        },
        methods: {    
            // is_loc_no_std_format(text) {
            //     const reg = /^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-\d{3}$/
            //     return !!text.match(reg)
            // },
            // is_loc_no_std_sp_format(text) {
            //     const reg = /^[A-Z0-9]{1,4}-[A-Z][0-9]{1,3}$/
            //     return !!text.match(reg)
            // },
            // 设置grid所在页码，以及在整个货架中的索引
            get_grid_page_and_index(bound={}, coord={}) {
                let page = Math.ceil(coord.x / this.column)
                let index = (bound.y - coord.y) * Math.ceil(bound.x / this.column) * this.column + coord.x
                return { page, index }
            },
            // 设置grid名称
            get_grid_name(coord={}) {
                return coord.y * 100 + coord.x
            },
            // 过滤swiper单页中的grids对象
            filter_swiper_grids(shelf, page) {
                return shelf.grids.filter(g => g.page == page).sort((a,b) => a.index - b.index)
            },
            // 获取swiper总页数
            get_swiper_pages(shelf) {
                return Math.ceil(shelf.bound.x / this.column) 
            },
            // 获取屏幕宽度
            get_swiper_height(shelf) {
                // let window_width = store.state.system_info.windowWidth
                return Math.ceil(this.grid_width * (shelf.bound.y + 0.6)) // swiper高度不会被内容撑开，需指定swiper高度
            },
            grid_click(e, shelf) {
                let grid = shelf.grids.find(g => g.index === e.detail.index)
                if (!grid) return
                if (grid.style == 'none') return
                if (this.forbidable || grid.status != 'forbidden'){
                    this.drawer_stock_loc = store.state.stock_locs.find(x => x.FNumber == grid.no)
                    this.$refs.inv_drawer.open()
                }
            },
            drawer_close() {
                this.$refs.inv_drawer.close()
            },
            inv_menu(inv) {
                if (!inv.FMaterialId) {
                    uni.showToast({ icon: 'none', title: '物料ID不能为空' })
                    return
                } 
                uni.showActionSheet({
                    itemList: ['库存明细', '库存调整', '物料详情'],
                    success: (e) => {
                        if (e.tapIndex === 0) link_to(`/pages/operation/manage/inv_search?t=${inv['FMaterialId.FNumber']}`)
                        if (e.tapIndex === 1) link_to(`/pages/operation/move/v2/plan_new?material_no=${inv['FMaterialId.FNumber']}`)
                        if (e.tapIndex === 2) link_to(`/pages/operation/material/show?id=${inv.FMaterialId}`)
                    }
                })
            },
            stock_loc_forbid(loc_no) {
                uni.showLoading({ title: 'Loading' })
                StockLoc.forbid([loc_no]).then(res => {
                    StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                        uni.hideLoading()
                        uni.showToast({ icon: 'none', title: `${loc_no} 禁用`})
                        this.$refs.inv_drawer.close()
                        store.commit('set_stock_locs', res.data)
                    })
                })
            },
            stock_loc_enable(loc_no) {
                uni.showLoading({ title: 'Loading' })
                StockLoc.enable([loc_no]).then(res => {
                    StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                        uni.hideLoading()
                        uni.showToast({ icon: 'none', title: `${loc_no} 解除禁用`})
                        this.$refs.inv_drawer.close()
                        store.commit('set_stock_locs', res.data)
                    })
                })
            }
        }
    }
</script>

<style lang="scss">
    .collapse_header {
        height: 48px; 
        display: flex; 
        align-items: center; 
        justify-content: space-between;
        .shelf_name {
            font-size: $uni-font-size-lg !important;
            font-weight: bold;
        }
    }

    .shelf_swiper {
        .grid-item-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            // width: 100%;
            // height: 100%;
            padding: 0;
            border-radius: 3px;
            border: 1px solid #fff;
            &.default {
                background-color: $uni-text-color-disable;
            }
            &.success {
                background: linear-gradient(135deg, #4cd964, #67c23a);
                background-color: #67c23a;
            }
            &.info {
                background: linear-gradient(135deg, #55aaff, #3699fc);
                background-color: #409eff;
            }
            &.warn {
                background: linear-gradient(135deg, #f7ce50, #e6a23c);
                background-color: #e6a23c;
            }
            &.error {
                background: linear-gradient(135deg, #f56c6c, #FE6035);
                background-color: #f56c6c;
            }
            &.none {
                background-color: $uni-bg-color;
                .name {
                    color: $uni-bg-color;
                }
            }
            .name {
                width: 100%;
                font-size: $uni-font-size-sm;
                text-align: left;
                padding-left: 2px;
            }
            .qty {
                width: 100%;
                color: #fff;
                // #ifdef H5
                font-size: $uni-font-size-base;
                // #endif
                // #ifndef H5
                font-size: $uni-font-size-sm;
                // #endif
                font-weight: bold;
                text-align: right;
            }
        }
    }
</style>