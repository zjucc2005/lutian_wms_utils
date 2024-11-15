<template>
    <view>
        <uni-list>
            <uni-list-item title="出入库数量统计"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'tune', size: '24', color: '#007bff' }"
                @click="goTo('inventory_record')" clickable
                showArrow />
            <uni-list-item title="库存调整统计"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'redo', size: '24', color: '#007bff' }"
                @click="goTo('move_plan_record')" clickable
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
    import { play_audio_prompt } from '@/utils'
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            goTo(path) {
                play_audio_prompt('success')
                uni.navigateTo({ url: `/pages/operation/statistics/${path}` })
            }
        }
    }
</script>

<style>

</style>
