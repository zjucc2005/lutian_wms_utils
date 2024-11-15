<template>
    <view>
        <uni-list>
            <uni-list-item title="库存变更计划"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'list', size: '24', color: '#007bff' }"
                @click="goTo('inv_plans')" clickable
                showArrow />
<!--            <uni-list-item title="库存变更日志"
                :show-extra-icon="true"
                :extra-icon="{ type: 'list', size: '24', color: '#4cd964' }"
                clickable showArrow disabled />
            <uni-list-item title="库存分表"
                :show-extra-icon="true"
                :extra-icon="{ type: 'list', size: '24', color: '#dc3545' }"
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
                uni.navigateTo({ url: `/pages/operation/list/${path}` })
            }
        }
    }
</script>

<style>

</style>
