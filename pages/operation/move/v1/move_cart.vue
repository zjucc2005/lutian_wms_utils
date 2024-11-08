<template>
    <view>
        <uni-list>
            <uni-list-item
                v-for="(move_item, move_index) in move_cart.move_list"
                :key="move_index"
                :rightText="[move_item.qty, move_item.inv['FStockUnitId.FName']].join(' ')"
            >
                <template v-slot:body>
                    <view class="uni-list-item__content uni-list-item__content--center">
                        <text class="uni-list-item__content-title">{{ move_item.inv['FMaterialId.FNumber'] }}</text>
                        <view class="uni-list-item__content-note">
                            <view>{{ move_item.inv['FMaterialId.FName'] }}</view> 
                            <view>{{ move_item.inv['FMaterialId.FSpecification'] }}</view>
                            <view>
                                库位号：{{ move_item.inv['FStockLocId.FNumber'] }}
                                <uni-icons type="redo" color="#007bff"></uni-icons> 
                                <text class="new_loc_no">{{ move_item.loc_no }}</text>
                            </view>
                            <view>
                                批次号：<text class="batch_no">{{ move_item.inv['FBatchNo'] }}</text>  
                            </view>
                        </view>
                    </view>
                </template>
            </uni-list-item>           
        </uni-list>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { MoveCart } from '@/utils/model'
    export default {
        data() {
            return {
                cur_staff: {},
                move_cart: { move_list: [] },
                goods_nav: {
                    options: [
                        { icon: 'cart', text: '计划', info: 0 }
                    ],
                    button_group: [
                        {
                            text: '清空计划',
                            backgroundColor: 'linear-gradient(90deg, #AAA, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '提交计划',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_staff = store.state.cur_staff
            this.move_cart = MoveCart.current()
            this.refresh_cart_info()
        },
        methods: {
            // >>> component
            goods_nav_click(e) {
                if (e.index == 0) this.$logger.info('move_cart', this.move_cart)
            },
            goods_nav_button_click(e) {
                if (e.index == 0) this.if_clear_cart() // btn:清空计划
                if (e.index == 1) this.if_submit_move() // btn:提交计划
            },
            // >>> action
            if_clear_cart() {
                uni.showActionSheet({
                    itemList: ['清空计划'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.clear_cart()
                    }
                })
            },
            clear_cart() {
                let move_cart = new MoveCart(this.move_cart)
                this.move_cart = move_cart.destroy()
                this.refresh_cart_info()
                uni.$emit('syncMoveCart', { msg: 'sync_move_cart' })
                // uni.navigateBack()
            },
            if_submit_move() {
                if (this.move_cart.move_list.length) {
                    uni.showModal({
                        title: "提交计划注意事项",
                        content: '请仔细核对库存调整信息，提交计划后，将会更新库存数据。',
                        success: (res) => {
                            if (res.confirm) this.submit_move()
                        },
                        fail: (err) => {
                        }
                    })
                } else {
                    uni.showToast({ icon: 'none', title: '计划为空' })
                }   
            },
            async submit_move() {
                try {
                    play_audio_prompt('success')
                    uni.showLoading({ title: 'Loading' })
                    let move_cart = new MoveCart(this.move_cart)
                    await move_cart.exec({ staff_no: this.cur_staff.FNumber })
                    uni.showToast({ title: '提交成功' })
                    this.move_cart = MoveCart.current()
                    this.refresh_cart_info()
                    uni.$emit('syncMoveCart', { msg: 'sync_move_cart' })
                } catch(err) {
                    uni.hideLoading()
                }
            },
            refresh_cart_info() {
                let sum_qty = 0
                this.move_cart.move_list.map(x=> sum_qty += x.qty)
                this.goods_nav.options[0].info = sum_qty // 更新cart角标数量
            }
        }
    }
</script>

<style lang="scss">
    .uni-list-item__content {
        /* #ifndef APP-NVUE */
        display: flex;
        /* #endif */
        padding-right: 8px;
        flex: 1;
        color: #3b4144;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
    }

    .uni-list-item__content--center {
        justify-content: center;
    }

    .uni-list-item__content-title {
        font-size: $uni-font-size-base;
        color: #3b4144;
        overflow: hidden;
    }

    .uni-list-item__content-note {
        margin-top: 6rpx;
        color: $uni-text-color-grey;
        font-size: $uni-font-size-sm;
        overflow: hidden;
        .new_loc_no {
            margin-left: 5px;
            color: $uni-color-primary;
        }
        .batch_no {
            color: $uni-color-primary;
        }
    }
</style>
