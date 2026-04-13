<template>
    <uni-list>
        <uni-list-item title="收料通知单下推检验单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'arrow-down' }" show-extra-icon
            @click="link_to('/pages/k3cloud/pur/receive_bill/to_inspect')" clickable
            show-arrow/>
        <uni-list-item title="检验单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'list' }" show-extra-icon
            @click="link_to('/pages/k3cloud/qm/inspect_bill/index')" clickable
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

