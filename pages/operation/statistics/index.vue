<template>
    <view>
        <uni-list>
            <uni-list-item title="出入库数量统计"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'tune', size: '24', color: '#007bff' }"
                @click="goTo('inventory_record')" clickable
                showArrow />
            <uni-list-item title="统计2"
                :show-extra-icon="true"
                :extra-icon="{ color: '#4cd964', size: '24', type: 'map' }"
                clickable showArrow disabled />
            <uni-list-item title="统计3"
                :show-extra-icon="true"
                :extra-icon="{ color: '#dc3545', size: '24', type: 'paperplane' }"
                clickable showArrow disabled />
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
