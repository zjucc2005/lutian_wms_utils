<template>
    <uni-list>
        <uni-list-item title="生产用料清单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'list' }" show-extra-icon
            @click="link_to('/pages/k3cloud/prd/ppbom/index')" clickable
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
