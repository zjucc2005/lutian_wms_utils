<template>
    <uni-list>
        <uni-list-item title="script: BOM批量模版转化层级号"
            :show-extra-icon="true"
            :extra-icon="{ color: '#007bff', size: '24', type: 'link' }"
            @click="link_to('/pages/my/utils/bom_level_transfer')"
            clickable
            show-arrow
            />
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
            link_to
        }
    }
</script>

<style>

</style>
