<template>
    <view>
        <uni-list>
            <!-- <uni-list-item title="标签DEMO"
                :show-extra-icon="true"
                :extra-icon="{ color: '#007aff', size: '24', type: 'image' }"
                @click="link_to('/pages/operation/print/demo')" clickable show-arrow /> -->
            <uni-list-item title="生成物料标签（收料通知单）"
                :extra-icon="{ color: '#007aff', size: '24', type: 'calendar' }" show-extra-icon
                @click="link_to('/pages/operation/print/material_label_by_cgsl')" clickable show-arrow />
            <uni-list-item title="生成《物流拣选单》"
                :extra-icon="{ color: '#007aff', size: '24', type: 'list' }" show-extra-icon
                @click="link_to('/pages/operation/print/mo_picking')" clickable show-arrow />
            <uni-list-item title="生成《物流状态确认表》"
                :extra-icon="{ color: '#007aff', size: '24', type: 'list' }" show-extra-icon
                @click="link_to('/pages/operation/print/mo_confirming')" clickable show-arrow />
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
