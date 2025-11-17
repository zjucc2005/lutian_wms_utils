<template>
    <uni-list>
        <uni-list-item title="生产用料清单"
            :extra-icon="{ color: '#007bff', size: '24', type: 'list' }" show-extra-icon
            @click="link_to('/pages/k3cloud/shengchanguanli/shengchanyongliaoqingdan/index')" clickable show-arrow/>
        <!-- <uni-list-item title="生产发料 /  调整序号"
            :extra-icon="{ color: '#dd524d', size: '24', type: 'loop' }" show-extra-icon
            @click="link_to('/pages/k3cloud/shengchanguanli/shengchanfaliaotongzhidan/modify_seq')" clickable show-arrow/> -->
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
