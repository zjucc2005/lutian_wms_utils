<template>
    <view>
        <uni-list>
            <!-- <uni-list-item title="物流拣选单"
                :extra-icon="{ color: '#007aff', size: '24', type: 'compose' }" show-extra-icon
                @click="link_to('/pages/operation/print/mo_picking')" clickable show-arrow /> -->
            <uni-list-item title="物料状态确认表"
                :extra-icon="{ color: '#007aff', size: '24', type: 'compose' }" show-extra-icon
                @click="link_to('/pages/operation/record/mo_confirming')" clickable show-arrow />
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
