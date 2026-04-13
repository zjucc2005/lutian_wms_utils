<template>
    <uni-list>
        <uni-list-item title="采购订单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'list' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pur/purchase_order/index')" clickable
            show-arrow/>
        <uni-list-item title="收料通知单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'list' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pur/receive_bill/index')" clickable
            show-arrow/>
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
