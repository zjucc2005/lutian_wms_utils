<template>
    <view>
        <uni-list>
            <uni-list-item title="拣选出库Depre"
                :extra-icon="{ color: '#c0c0c0', size: '24', type: 'cart' }" show-extra-icon
                @click="link_to('/pages/operation/outbound/by_order')" clickable show-arrow />
            <uni-list-item title="发料出库（生产投料）"
                :extra-icon="{ color: '#007aff', size: '24', type: 'cart' }" show-extra-icon
                @click="link_to('/pages/operation/outbound/issue')" clickable show-arrow />
            <uni-list-item title="直接出库（含替代料）"
                :extra-icon="{ color: '#007aff', size: '24', type: 'scan' }" show-extra-icon
                @click="link_to('/pages/operation/outbound/direct')" clickable show-arrow />
            <uni-list-item title="其他出库（出库申请，调拨申请）"
                :extra-icon="{ color: '#007aff', size: '24', type: 'plusempty' }" show-extra-icon
                @click="link_to('/pages/operation/outbound/other')" clickable show-arrow />
            <uni-list-item title="包材出库"
                :extra-icon="{ color: '#007aff', size: '24', type: 'gift' }" show-extra-icon
                @click="link_to('/pages/operation/outbound/packaging')" clickable show-arrow />
        </uni-list>
    </view>
</template>

<script>
    import { link_to } from '@/utils'
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            link_to
        }
    }
</script>

<style>

</style>
