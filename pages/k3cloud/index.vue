<template>
    <uni-list class="uni-mb-5">
        <uni-list-item title="物料清单"
            :show-extra-icon="true"
            :extra-icon="{ type: 'list', size: '24', color: '#007bff' }"
            @click="link_to('./eng_bom/index')" clickable
            show-arrow />
    </uni-list>
</template>

<script>
    import { link_to } from '@/utils'
    export default {
        data() {
            return {
                nav_list: [
                    { name: '生产制造', children: [
                        { name: '工程数据管理', children: [
                            { name: '物料清单', url: './eng_bom' }
                        ] }
                    ] }
                ]
            }
        },
        methods: {
            link_to,
            
        }
    }
</script>

<style lang="scss" scoped>

</style>
