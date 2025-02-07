<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        >
        <uni-list>
            <uni-list-item
                :show-extra-icon="true"
                :extra-icon="{ type: 'right',  color: '#007bff' }"
                title="库存总数量"
                :rightText="`${sum_qty}`"
                >
            </uni-list-item>
        </uni-list>
        <cc-shelf
            :stock_locs="$store.state.stock_locs"
            :invs="invs"
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
                this.invs = res.invs
            })
        },
        computed: {
            sum_qty() {
                let sum = 0
                for (let inv of this.invs) {
                    sum += inv.FQty
                }
                return sum
            }
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
