<template>
    <uni-section :title="breadcrumb_stockname()" type="square"
        :sub-title="`数据时间：${formatDate(data_time, 'yyyy-MM-dd hh:mm:ss')}`" sub-title-color="#007aff">
        <cc-shelf
            :stock_locs="$store.state.stock_locs"
            :invs="invs"
            :open="cc_shelf_open"/>
    </uni-section>
</template>

<script>
    import { breadcrumb_stockname, formatDate } from '@/utils';
    export default {
        data() {
            return {
                invs: [],
                data_time: null,
                cc_shelf_open: true
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendInvs', res => {
                this.invs = res.invs
                this.data_time = res.data_time
            })
        },
        methods: {
            breadcrumb_stockname,
            formatDate
        }
    }
</script>

<style>

</style>
