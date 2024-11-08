<template>
    <!-- <uni-notice-bar text="测试版" single show-icon/> -->
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
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                // 导航界面信息
                navs: [
                    {
                        name: '入库', permission: ['wh_admin'], icon_path: '/static/icon/ruku.png',
                        action: () => { this.goTo('inbound/v2/index') }
                    },
                    {
                        name: '出库', permission: ['wh_admin'], icon_path: '/static/icon/chuku.png',
                        action: () => { this.goTo('outbound/v2/index') }
                    },
                    {
                        name: '库存调整', permission: ['wh_admin'], icon_path: '/static/icon/kucuntiaozheng.png',
                        action: () => { this.goTo('move/v2/index') }
                    },
                    {
                        name: '生产订单', permission: ['nrj_admin', 'guest'], icon_path: '/static/icon/zuoyefenpei_red.png',
                        action: () => { this.goTo('manufacture_order/index') }
                    },
                    {
                        name: '库存查询', permission: ['wh_admin', 'wh_staff'], icon_path: '/static/icon/saomiao.png',
                        action: () => { this.inv_search() }
                    },
                    {
                        name: '库存总览', permission: ['wh_admin'], icon_path: '/static/icon/kucun.png',
                        action: () => { this.goTo('manage/invs') }
                    },
                    {
                        name: '库位管理', permission: ['wh_admin'], icon_path: '/static/icon/kuwei.png',
                        action: () => { this.goTo('manage/locs') }
                    },
                    {
                        name: '库位报警', permission: ['wh_staff'], icon_path: '/static/icon/kuweibaojing.png',
                        action: () => { this.goTo('manage/locs') }
                    },
                    {
                        name: '物料查询', permission: ['all'], icon_path: '/static/icon/chaxunkucun.png',
                        action: () => { this.goTo('material/search') }
                    },
                    {
                        name: '列表', permission: ['wh_admin'], icon_path: '/static/icon/liebiao.png',
                        action: () => { this.goTo('list/index') }
                    },
                    {
                        name: '统计', permission: ['wh_admin'], icon_path: '/static/icon/tongji.png',
                        action: () => { this.goTo('statistics/index') }
                    },
                    {
                        name: '其他功能', permission: ['wh_admin'], icon_path: '/static/icon/qita.png',
                        action: () => { this.goTo('manage/index') }
                    }
                ]
            }
        },
        onShow() {
            
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
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') {
                        uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                    }
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                    }
                })
                // #endif
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
        width: 60px;
    }
</style>