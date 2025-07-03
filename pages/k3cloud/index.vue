<template>
    <!-- 自制组件，自适应窗口变化 -->
    <cc-grid>
        <template v-for="(nav, index) in navs" :key="index">
            <cc-grid-item v-if="nav.permission.includes($store.state.role) || (nav.permission.includes('all') && $store.state.role != 'guest')" @click="nav.action">
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
    import { link_to } from '@/utils'
    import ccGrid from '@/components/cc-grid/cc-grid.vue'
    import ccGridItem from '@/components/cc-grid/cc-grid-item.vue'
    export default {
        components: {
            ccGrid, ccGridItem
        },
        data() {
            return {
                navs: [
                    {
                        name: '采购管理', permission: ['all'], icon_path: '/static/icon/nav_list_cart.png',
                        action: () => { link_to('/pages/k3cloud/caigouguanli/index') }
                    },
                    {
                        name: '销售管理', permission: ['wh_admin'], icon_path: '/static/icon/nav_list_money.png',
                        action: () => { link_to('/pages/k3cloud/xiaoshouguanli/index') }
                    }
                ]
            }
        },
        methods: {
            
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
