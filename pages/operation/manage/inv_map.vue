<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        >
        <cc-shelf
            :stock_locs="$store.state.stock_locs"
            :invs="invs"
            :column="10"
            :open="cc_shelf_open"/>
    </uni-section>
</template>

<script>
    export default {
        data() {
            return {
                invs: [],
                cc_shelf_open: true
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendInvs', res => {
                console.log('eventChannel.on sendInvs', res)
                this.invs = res.invs
            })
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
