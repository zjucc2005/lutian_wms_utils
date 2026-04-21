<template>
    <uni-list>
        <uni-list-item title="计划订单查询"
            :extra-icon="{ color: '#007bff', size: '24', type: 'calendar' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/plan_order/search')" clickable
            show-arrow/>
        <uni-list-item title="生产订单领用查询"
            :extra-icon="{ color: '#007bff', size: '24', type: 'paperplane' }" show-extra-icon
            @click="link_to('/pages/k3cloud/prd/mo/receive_search')" clickable show-arrow/>
        <uni-list-item title="即时库存 / 采购申请单 / 采购订单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'map' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/inv_analysis')" clickable show-arrow/>
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
