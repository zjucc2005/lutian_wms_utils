<template>
    <uni-list class="uni-mb-10">
        <uni-list-item title="发料" v-if="['nrj_admin'].includes($store.state.role)"
            :show-extra-icon="true"
            :extra-icon="{ type: 'upload', size: '24', color: '#007bff' }"
            @click="goTo('manufacture_order/send_material')" clickable showArrow />
        <uni-list-item title="用料"
            :show-extra-icon="true"
            :extra-icon="{ type: 'download', size: '24', color: '#dd524d' }"
            @click="goTo('manufacture_order/send_material?op_type=receive')" clickable showArrow />
        <uni-list-item title="扫描日志"
            :show-extra-icon="true"
            :extra-icon="{ type: 'search', size: '24', color: '#007bff' }"
            @click="goTo('manufacture_order/issuemtr_logs')" clickable showArrow />
    </uni-list>
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
                uni.navigateTo({ url: `/pages/operation/${path}` })
            }
        }
    }
</script>

<style>

</style>
