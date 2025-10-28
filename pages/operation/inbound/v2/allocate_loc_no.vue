<template>
    <uni-section title="分配托盘库位" type="square"
        sub-title="点击闲置库位进行分配"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        @click="console.log('view', this.$data)"
        >
        <uni-list>
            <uni-list-item
                :show-extra-icon="true"
                :extra-icon="{ type: 'right',  color: '#007bff' }"
                title="已分配托盘数"
                :rightText="`${sum_checked_qty} / ${pallet_qty}`"
                >
            </uni-list-item>
        </uni-list>
        <cc-shelf-allocate
            v-if="stock_locs.length"
            v-model="allocate_info"
            :stock_locs="stock_locs"
            :demand_qty="pallet_qty"
            :strict="strict"
            open
            />
        <view class="fixed-btn"
              :style="{ background: `linear-gradient(to top, #007aff ${checked_percentage}, #c0c0c0 ${checked_percentage})` }"
              @click="click_confirm"
              >
            <view v-if="sum_checked_qty < pallet_qty">{{ sum_checked_qty }}</view>
            <uni-icons v-else type="checkmarkempty" size="40" color="#fff"></uni-icons>
        </view>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { is_loc_no_std_format, is_loc_no_std_sp_format } from '@/utils'
    import ccShelfAllocate from '@/components/cc-shelf/cc-shelf-allocate.vue'
    export default {
        components: {
            ccShelfAllocate
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel()
            eventChannel.on('initStockLocs', res => {
                // this.$logger.info('eventChannel res:', res)
                this.stock_locs = res.stock_locs || []
                this.pallet_qty = res.pallet_qty || 0
            })
        },
        data() {
            return {
                allocate_info: [], // 分配的库位和对应托盘位数量， { no: '', plt_space: 2 }
                stock_locs: [],
                pallet_qty: 0,
                strict: true,
                goods_nav: {
                    options: [
                        { icon: 'map-filled', text: '已分配', info: 0 }
                    ],
                    button_group: [
                        {
                            text: '返回',
                            backgroundColor: store.state.goods_nav_color.grey,
                            color: '#fff'
                        },
                        {
                            text: '预览',
                            backgroundColor: store.state.goods_nav_color.yellow,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        computed: {
            sum_checked_qty() {
                let sum = 0
                for (let info of this.allocate_info) {
                    sum += info.v
                }
                return sum
            },
            checked_percentage() {
                return (this.sum_checked_qty / this.pallet_qty * 100).toFixed() + '%'
            }
        },
        methods: {
            click_confirm() {
                if (this.sum_checked_qty < this.pallet_qty) {
                    uni.showToast({ icon: 'error', title: '未分配完毕' })
                    return
                }
                const eventChannel = this.getOpenerEventChannel()
                eventChannel.emit('allocateInfo', { allocate_info: this.allocate_info })
                uni.navigateBack()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data) // btn:查看已选库位
            },
            goods_nav_button_click(e) {
                if (e.index === 0) uni.navigateBack()
                if (e.index === 1) this.preview()
            },
            preview() {
                if (this.sum_plt_alloc() < this.pallet_qty) {
                    uni.showToast({ icon: 'none', title: `${this.pallet_qty - this.sum_plt_alloc()}个托盘未分配` })
                    return
                }
                const eventChannel = this.getOpenerEventChannel()
                eventChannel.emit('allocateInfo', { allocate_info: this.allocate_info })
                uni.navigateBack()
            }
        }
    }
</script>

<style lang="scss" scoped>
    .fixed-btn {
        position: fixed;
        bottom: 48px;
        right: 40px;
        width: 72px;
        height: 72px;
        border-radius: 50px;
        box-shadow: 0 1px 5px 2px rgba(0, 0, 0, 0.3);
        color: #fff;
        font-size: 36px;
        line-height: 0;
        display: flex;
        align-items: center;
        justify-content: space-around;
    }
</style>
