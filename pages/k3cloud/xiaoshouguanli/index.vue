<template>
    <uni-list>
        <uni-list-item title="发货通知单"
            :show-extra-icon="true"
            :extra-icon="{ color: '#007bff', size: '24', type: 'notification' }"
            @click="link_to('/pages/k3cloud/xiaoshouguanli/fahuotongzhidan/index')"
            clickable
            show-arrow
            />
    </uni-list>
</template>

<script>
    import { link_to, get_latest_version } from '@/utils'
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
