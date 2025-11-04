<template>
    <!-- 自制组件，自适应窗口变化 -->
    <cc-grid>
        <template v-for="(nav, index) in navs" :key="index">
            <cc-grid-item v-if="$store.state.role == 'su' || nav.permission.includes($store.state.role) || (nav.permission.includes('all') && $store.state.role != 'guest')" @click="nav.action">
                <view class="grid-item-box">
                    <image :src="nav.icon_path" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">{{ nav.name }}</text>
                </view>
            </cc-grid-item>
        </template>
    </cc-grid>
    
    <!-- 仓库选择组件 -->
    <uni-popup ref="nav_dialog" type="dialog">
        <uni-popup-dialog
            type="error"
            title="切换仓库"
            cancelText="关闭"
            @close="nav_dialog_close"
            @confirm="nav_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <uni-forms ref="nav_form" :model="nav_form" :rules="nav_form_rules" style="width: 100%;">
                <uni-forms-item label="仓库" name="stock_id">
                    <uni-data-picker
                        ref="stock_id_picker"
                        v-model="nav_form.stock_id"
                        :localdata="nav_form.bd_stock_opts"
                        popup-title="请选择所属仓库"
                        />
                </uni-forms-item>
            </uni-forms>
        </uni-popup-dialog>
    </uni-popup>
    
    
</template>

<script>
    import store from '@/store'
    import { link_to, play_audio_prompt } from '@/utils'
    import { StockLoc } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    import ccGrid from '@/components/cc-grid/cc-grid.vue'
    import ccGridItem from '@/components/cc-grid/cc-grid-item.vue'
    export default {
        components: {
            ccGrid, ccGridItem
        },
        data() {
            return {
                // 导航界面信息
                navs: [
                    // #ifdef APP-PLUS || H5
                    {
                        name: '入库扫码', permission: ['nrj_admin'], icon_path: '/static/icon/nav_scan_in_warn.png',
                        action: () => { link_to('/pages/operation/inbound/v1/easy') }
                    },
                    // {
                    //     name: '出库扫描', permission: ['wh_admin'], icon_path: '/static/icon/nav_scan_out.png',
                    //     action: () => { link_to('/pages/operation/outbound/v1/index') }
                    // },
                    // #endif
                    {
                        name: '入库计划', permission: ['wh_admin', 'nrj_admin'], icon_path: '/static/icon/nav_stock_in.png',
                        action: () => { link_to('/pages/operation/inbound/v2/index') }
                    },
                    {
                        name: '出库计划', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_out.png',
                        action: () => { link_to('/pages/operation/outbound/v2/index') }
                    },
                    {
                        name: '库内调拨', permission: ['nrj_admin'], icon_path: '/static/icon/nav_scan_move.png',
                        action: () => { link_to('/pages/operation/move/unpack') }
                    },
                    {
                        name: '出库', permission: ['nrj_admin'], icon_path: '/static/icon/nav_scan_out.png',
                        action: () => { link_to('/pages/operation/outbound/v2/index') }
                    },
                    {
                        name: '库存调整', permission: ['wh_admin', 'nrj_admin'], icon_path: '/static/icon/nav_stock_move.png',
                        action: () => { link_to('/pages/operation/move/v2/index') }
                    },
                    {
                        name: '库存查询', permission: ['wh_admin', 'wh_staff', 'nrj_admin'], icon_path: '/static/icon/nav_scan.png',
                        action: () => { this.inv_search() }
                    },
                    {
                        name: '库存总览', permission: ['wh_admin', 'nrj_admin'], icon_path: '/static/icon/nav_stock.png',
                        action: () => { link_to('/pages/operation/manage/invs') }
                    },
                    {
                        name: '库位管理', permission: ['wh_admin', 'nrj_admin'], icon_path: '/static/icon/nav_stock_loc.png',
                        action: () => { link_to('/pages/operation/manage/locs') }
                    },
                    // {
                    //     name: '库位报警', permission: ['wh_staff'], icon_path: '/static/icon/nav_stock_warn.png',
                    //     action: () => { link_to('/pages/operation/manage/locs') }
                    // },
                    {
                        name: '物料查询', permission: ['default', 'wh_admin', 'wh_staff', 'nrj_admin', 'guest'], icon_path: '/static/icon/nav_stock_search.png',
                        action: () => { link_to('/pages/operation/material/search') }
                    },
                    // {
                    //     name: '配件查询', permission: ['default'], icon_path: '/static/icon/nav_node_tree.png',
                    //     action: () => { link_to('/pages/operation/material/search_parts') }
                    // },
                    {
                        name: '出库查询', permission: ['default'], icon_path: '/static/icon/nav_truck.png',
                        action: () => { link_to('/pages/operation/outbound/v2/search') }
                    },
                    {
                        name: '列表', permission: ['wh_admin', 'nrj_admin'], icon_path: '/static/icon/nav_list_search.png',
                        action: () => { link_to('/pages/operation/list/index') }
                    },
                    {
                        name: '统计', permission: ['wh_admin', 'nrj_admin'], icon_path: '/static/icon/nav_chart.png',
                        action: () => { link_to('/pages/operation/statistics/index') }
                    },
                    // {
                    //     name: '生产订单', permission: ['nrj_admin', 'guest'], icon_path: '/static/icon/nav_list_move.png',
                    //     action: () => { link_to('/pages/operation/manufacture_order/index') }
                    // },
                    {
                        name: '标签打印', permission: ['nrj_admin'], icon_path: '/static/icon/nav_printer.png',
                        action: () => { link_to('/pages/operation/print/index') }
                    }
                    // ,
                    // {
                    //     name: '其他功能', permission: ['wh_admin'], icon_path: '/static/icon/nav_others.png',
                    //     action: () => { link_to('/pages/operation/manage/index') }
                    // }
                ],
                nav_form: {
                    stock_id: store.state.cur_stock.FStockId,
                    bd_stock_opts: store.state.bd_stock_opts
                },
                nav_form_rules: {
                    stock_id: {
                        rules: [
                            { required: true, errorMessage: '请选择仓库'},
                        ]
                    }
                }
            }
        },
        onReady() {
            setTimeout(_ => {
                uni.setNavigationBarTitle({
                    title: store.state.cur_stock['FName'] // topbar显示仓库名
                })
            }, 100)
        },
        onNavigationBarButtonTap(e) {
            if (e.index === 0) {
                console.log('this.$data', this.$data)
                let bd_stock_opts = []
                for (let opt of store.state.bd_stock_opts) {
                    bd_stock_opts.push({
                        ...opt,
                        disable: opt.value != store.state.cur_stock.FUseOrgId
                    })
                }
                this.nav_form.bd_stock_opts = bd_stock_opts
                this.$refs.nav_dialog.open()
            }
        },
        methods: {
            inv_search() {
                scan_code().then(res => {
                    uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            nav_dialog_close() {
                this.$refs.nav_dialog.close()
            },
            nav_dialog_confirm() {
                this.$refs.nav_form.validate().then(res => {
                    let cur_stock = store.state.bd_stocks.find(d => d.FStockId === this.nav_form.stock_id)
                    store.commit('set_cur_stock', cur_stock)
                    uni.setNavigationBarTitle({
                        title: store.state.cur_stock['FName']
                    })
                    // 重新加载库位数据
                    StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                        store.commit('set_stock_locs', res.data)
                        uni.showToast({ title: "已切换仓库" })
                        play_audio_prompt('success')
                    })
                    // 清空出入库计划
                    
                    this.$refs.nav_dialog.close()
                }).catch(err => {})
            }
        }
    }
</script>

<style lang="scss" scoped>
    .grid-item-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        
        // #ifdef H5
        &:hover {
            background-color: #f1f1f1;
            border-radius: 5px;
        }
        // #endif
        
        .grid-item-text {
            font-size: 14px;
            color: #666;
            font-weight: bold;
            line-height: 24px;
            margin-top: 10px;
            margin-bottom: -20px;
        }
        .grid-item-icon {
            width: 64px;
        }
    }

</style>