<template>
    <!--
    <uni-grid :column="grid_column" :highlight="true" :show-border="false">
        <template v-for="(nav, index) in navs" :key="index">
            <uni-grid-item v-if="nav.permission.includes($store.state.role) || nav.permission.includes('all')" @click="nav.action">
                <view class="grid-item-box">
                    <image :src="nav.icon_path" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">{{ nav.name }}</text>
                </view>
            </uni-grid-item>
        </template>
    </uni-grid>
    -->
    
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
    import { play_audio_prompt } from '@/utils'
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
                        action: () => { this.goTo('inbound/v2/index') }
                    },
                    {
                        name: '出库', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_out.png',
                        action: () => { this.goTo('outbound/v2/index') }
                    },
                    {
                        name: '库存调整', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_move.png',
                        action: () => { this.goTo('move/v2/index') }
                    },
                    {
                        name: '生产订单', permission: ['nrj_admin', 'guest'], icon_path: '/static/icon/nav_list_move.png',
                        action: () => { this.goTo('manufacture_order/index') }
                    },
                    {
                        name: '库存查询', permission: ['wh_admin', 'wh_staff'], icon_path: '/static/icon/nav_scan.png',
                        action: () => { this.inv_search() }
                    },
                    {
                        name: '库存总览', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock.png',
                        action: () => { this.goTo('manage/invs') }
                    },
                    {
                        name: '库位管理', permission: ['wh_admin'], icon_path: '/static/icon/nav_stock_loc.png',
                        action: () => { this.goTo('manage/locs') }
                    },
                    {
                        name: '库位报警', permission: ['wh_staff'], icon_path: '/static/icon/nav_stock_warn.png',
                        action: () => { this.goTo('manage/locs') }
                    },
                    {
                        name: '物料查询', permission: ['all'], icon_path: '/static/icon/nav_stock_search.png',
                        action: () => { this.goTo('material/search') }
                    },
                    {
                        name: '列表', permission: ['wh_admin'], icon_path: '/static/icon/nav_list_search.png',
                        action: () => { this.goTo('list/index') }
                    },
                    {
                        name: '统计', permission: ['wh_admin'], icon_path: '/static/icon/nav_chart.png',
                        action: () => { this.goTo('statistics/index') }
                    },
                    // {
                    //     name: '其他功能', permission: ['wh_admin'], icon_path: '/static/icon/nav_others.png',
                    //     action: () => { this.goTo('manage/index') }
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
        computed: {
            grid_column() {
                return Math.min(6, Math.floor(store.state.system_info.windowWidth / 125)) 
            }
        },
        methods: {
            goTo(path) {
                play_audio_prompt('success')
                uni.navigateTo({ url: `/pages/operation/${path}` })
            },
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

<style>
    .grid-item-box {
        flex: 1;
        /* #ifndef APP-NVUE */
        display: flex;
        /* #endif */
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 15px 0;
    }
    .grid-item-text {
        font-size: 14px;
        color: #666;
        font-weight: bold;
        margin-top: 6px;
        
    }
    .grid-item-icon {
        width: 64px;
    }
</style>