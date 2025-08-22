<template>
    <uni-list>
        <uni-list-item title="采购订单"
            :show-extra-icon="true"
            :extra-icon="{ color: '#007bff', size: '24', type: 'cart' }"
            @click="link_to('/pages/k3cloud/caigouguanli/caigoudingdan/index')"
            clickable
            show-arrow
            />
        <uni-list-item title="收料通知单"
            :show-extra-icon="true"
            :extra-icon="{ color: '#007bff', size: '24', type: 'calendar' }"
            @click="link_to('/pages/k3cloud/caigouguanli/shouliaotongzhidan/index')"
            clickable
            show-arrow
            />
    </uni-list>
</template>

<script>
    import { link_to } from '@/utils'
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
