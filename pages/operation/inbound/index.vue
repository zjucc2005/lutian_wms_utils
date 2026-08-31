<template>
    <view>
        <uni-list>
            <uni-list-item title="直接入库"
                :extra-icon="{ color: '#007aff', size: '24', type: 'scan' }" show-extra-icon
                @click="link_to('/pages/operation/inbound/direct')" clickable show-arrow />
            <uni-list-item title="包材入库"
                :extra-icon="{ color: '#007aff', size: '24', type: 'gift' }" show-extra-icon
                @click="link_to('/pages/operation/inbound/packaging')" clickable show-arrow />
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
