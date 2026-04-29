<template>
    <uni-list>
        <uni-list-item title="计划订单查询"
            :extra-icon="{ color: '#007bff', size: '24', type: 'calendar' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/plan_order/search')" clickable
            show-arrow/>
        <uni-list-item title="生产订单领用查询"
            :extra-icon="{ color: '#007bff', size: '24', type: 'paperplane' }" show-extra-icon
            @click="link_to('/pages/k3cloud/prd/mo/receive_search')" clickable show-arrow/>
        <uni-list-item title="在途订单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'map' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/inv_analysis')" clickable show-arrow/>
        <uni-list-item title="物料清单反查（查顶层）"
            :extra-icon="{ color: '#007bff', size: '24', type: 'search' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/bom_find_ancestors')" clickable show-arrow/>
        <uni-list-item title="物料批改"
            :extra-icon="{ color: '#dd524d', size: '24', type: 'compose' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/material_batch_update')" clickable show-arrow/>
        <uni-list-item title="物料清单批改"
            :extra-icon="{ color: '#dd524d', size: '24', type: 'compose' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pln/bom_batch_update')" clickable show-arrow/>
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
