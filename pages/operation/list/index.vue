<template>
    <view>
        <uni-list>
            <uni-list-item title="库存变更计划"
                :show-extra-icon="true" 
                :extra-icon="{ type: 'chat', size: '24', color: '#007bff' }"
                @click="link_to('/pages/operation/list/inv_plans')" clickable
                show-arrow />
           <uni-list-item title="库存变更日志"
                :show-extra-icon="true"
                :extra-icon="{ type: 'chat-filled', size: '24', color: '#007bff' }"
                @click="link_to('/pages/operation/list/inv_logs')" clickable 
                show-arrow />
            <!-- <uni-list-item title="库存分表"
                :show-extra-icon="true"
                :extra-icon="{ type: 'list', size: '24', color: '#dc3545' }"
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
            link_to,
            
        }
    }
</script>

<style>

</style>
