<template>
    <!-- 自制组件，自适应窗口变化 -->
    <cc-grid>
        <template v-for="(nav, index) in navs" :key="index">
            <cc-grid-item v-if="nav.permission.includes($store.state.role) || nav.permission.includes('all')" @click="nav.action">
                <view class="grid-item-box">
                    <image :src="nav.icon_path" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">{{ nav.name }}</text>
                </view>
            </cc-grid-item>
        </template>
    </cc-grid>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt, link_to } from '@/utils'
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
                    {
                        name: '入库', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_in.png',
                        action: () => { link_to('/pages/operation/inbound/v2/index') }
                    },
                    {
                        name: '出库', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_out.png',
                        action: () => { link_to('/pages/operation/outbound/v2/index') }
                    },
                    {
                        name: '库存调整', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_move.png',
                        action: () => { link_to('/pages/operation/move/v2/index') }
                    },
                    {
                        name: '生产订单', permission: ['nrj_admin', 'guest'], icon_path: '/static/icon/nav_list_move.png',
                        action: () => { link_to('/pages/operation/manufacture_order/index') }
                    },
                    {
                        name: '库存查询', permission: ['wh_admin', 'wh_staff'], icon_path: '/static/icon/nav_scan.png',
                        action: () => { this.inv_search() }
                    },
                    {
                        name: '库存总览', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock.png',
                        action: () => { link_to('/pages/operation/manage/invs') }
                    },
                    {
                        name: '库位管理', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_loc.png',
                        action: () => { link_to('/pages/operation/manage/locs') }
                    },
                    {
                        name: '库位报警', permission: ['wh_staff'], icon_path: '/static/icon/nav_stock_warn.png',
                        action: () => { link_to('/pages/operation/manage/locs') }
                    },
                    {
                        name: '物料查询', permission: ['default', 'wh_admin', 'wh_staff', 'nrj_admin', 'guest'], icon_path: '/static/icon/nav_stock_search.png',
                        action: () => { link_to('/pages/operation/material/search') }
                    },
                    {
                        name: '配件查询', permission: ['default', 'wh_admin'], icon_path: '/static/icon/nav_node_tree.png',
                        action: () => { link_to('/pages/operation/material/search_parts') }
                    },
                    {
                        name: '列表', permission: ['wh_admin'], icon_path: '/static/icon/nav_list_search.png',
                        action: () => { link_to('/pages/operation/list/index') }
                    },
                    {
                        name: '统计', permission: ['wh_admin'], icon_path: '/static/icon/nav_chart.png',
                        action: () => { link_to('/pages/operation/statistics/index') }
                    }
                    // {
                    //     name: '其他功能', permission: ['wh_admin'], icon_path: '/static/icon/nav_others.png',
                    //     action: () => { link_to('/pages/operation/manage/index') }
                    // }
                ]
            }
        },
        onReady() {
            setTimeout(_ => {
                uni.setNavigationBarTitle({
                    title: store.state.cur_stock['FUseOrgId.FName'] // topbar显示组织名
                })
            }, 100)
        },
        methods: {
            inv_search() {
                scan_code().then(res => {
                    uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
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
            
        }
        .grid-item-icon {
            width: 64px;
        }
    }

</style>