<template>
    <view>
        <uni-list>
            <uni-list-item title="出入库数量统计"
                :extra-icon="{ type: 'tune', size: '24', color: '#007bff' }" show-extra-icon
                @click="link_to('/pages/operation/statistics/inventory_record')" clickable show-arrow />
            <uni-list-item title="库存调整统计"
                :extra-icon="{ type: 'redo', size: '24', color: '#007bff' }" show-extra-icon
                @click="link_to('/pages/operation/statistics/move_plan_record')" clickable show-arrow />
            <uni-list-item title="库存量统计"
                :extra-icon="{ type: 'calendar', size: '24', color: '#007bff' }" show-extra-icon
                @click="link_to('/pages/operation/statistics/inventory_daily')" clickable
                showArrow />
            <uni-list-item title="库存看板" v-if="$store.state.screen_type === 'h5'"
                :extra-icon="{ type: 'pyq', size: '24', color: '#007bff' }" show-extra-icon
                @click="link_to('/pages/operation/statistics/dashboard')" clickable
                showArrow />
            <uni-list-item title="金蝶库存明细汇总" v-if="$store.state.cur_stock['FUseOrgId.FName'] == '内燃机事业部'"
                :extra-icon="{ type: 'star-filled', size: '24', color: '#007bff' }" show-extra-icon
                @click="link_to('/pages/operation/statistics/stk_inv_summary')" clickable show-arrow />
            <!-- <uni-list-item title="监控看板-原料仓库"
                :extra-icon="{ type: 'eye-filled', size: '24', color: '#007bff' }" show-extra-icon
                @click="link_to('/pages/operation/statistics/monitor_wl')" clickable show-arrow /> -->
        </uni-list>
    </view>
</template>

<script>
    import { link_to } from '@/utils'
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            link_to
        }
    }
</script>

<style>

</style>
