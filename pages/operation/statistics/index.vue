<template>
    <view>
        <uni-list>
            <uni-list-item title="出入库数量统计"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'tune', size: '24', color: '#007bff' }"
                @click="link_to('/pages/operation/statistics/inventory_record')" clickable
                showArrow />
            <uni-list-item title="库存调整统计"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'redo', size: '24', color: '#007bff' }"
                @click="link_to('/pages/operation/statistics/move_plan_record')" clickable
                showArrow />
            <uni-list-item title="库存量统计"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'calendar', size: '24', color: '#007bff' }"
                @click="link_to('/pages/operation/statistics/inventory_daily')" clickable
                showArrow />
<!--            <uni-list-item title="库存周期统计"
                :show-extra-icon="true"
                :extra-icon="{ type: 'navigate', size: '24', color: '#4cd964' }"
                clickable showArrow disabled />
            <uni-list-item title="平均在库天数"
                :show-extra-icon="true"
                :extra-icon="{ type: 'paperplane', size: '24', color: '#dc3545' }"
                clickable showArrow disabled /> -->
        </uni-list>
    </view>
</template>

<script>
    import { play_audio_prompt, link_to } from '@/utils'
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
