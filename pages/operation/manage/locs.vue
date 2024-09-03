<template>
    <view>
        <uni-section
            title="库位列表"
            :sub-title="`${cur_stock['FGroup.FName']}/${cur_stock.FName}`"
            type="line"
            style="padding-bottom: 60px;"
        >
            <!-- <uni-list>
                <uni-list-item 
                    v-for="c_stock_loc in c_stock_locs"
                    :key="c_stock_loc.FID"
                    :title="c_stock_loc.FNumber"
                />
            </uni-list> -->
            
            <uni-swipe-action ref="c_stock_loc_swipe">
                <uni-swipe-action-item
                    v-for="(c_stock_loc, index) in c_stock_locs"
                    :key="index"
                    :threshold="60"
                    :right-options="swipe_action_options"
                    @click="swipe_action_click($event, index)"
                >
                    <uni-list-item :title="c_stock_loc.FNumber" :rightText="this.status_dict[c_stock_loc.FDocumentStatus]" />
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_buttonClick"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { get_c_stock_locs, delete_c_stock_locs } from '@/utils/api/c_stock_loc'
    export default {
        data() {
            return {
                cur_stock: {},
                c_stock_locs: [],
                status_dict: {
                    A: '已新增',
                    B: '已提交',
                    C: '已审核'
                },
                swipe_action_options: [
                    // {
                    //     text: '删除',
                    //     style: {
                    //         backgroundColor: '#f56c6c'
                    //     }
                    // }
                ],
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '排序' }
                    ],
                    button_group: [
                        {
                            text: '新增库位',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
        },          
        onShow() {
            this.load_c_stock_locs()
        },
        methods: {
            load_c_stock_locs() {
                get_c_stock_locs(store.state.cur_stock.FStockId).then(res => {
                    this.c_stock_locs = res.data
                })
            },
            swipe_action_click(e, list_index) {
                console.log('swipe action click e:', e, list_index) 
                if (e.index === 0) {
                    let c_stock_loc = this.c_stock_locs[list_index]
                    // console.log("delete c_stock_loc:", c_stock_loc)
                    delete_c_stock_locs([c_stock_loc.FID]).then(res => {
                        if (res.statusCode === 200 && res.data.Result.ResponseStatus.IsSuccess) {
                            this.c_stock_locs.splice(list_index, 1) // 删除行                           
                        } else {
                            uni.showToast({
                                icon: 'error',
                                title: res.data.Result.ResponseStatus.Errors[0].Message
                            })
                        }
                    }).catch(err => {
                        console.log('err:', err)
                        uni.showToast({
                            icon: 'error',
                            title: '不能删除'
                        })
                    }) 
                    this.$refs.c_stock_loc_swipe.closeAll() // 复位滑动操作
                }              
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    // 排序
                    uni.showActionSheet({
                        title: '',
                        itemList: ['按库位号排序', '按创建时间排序'],
                        popover: {},
                        success: (e) => {
                            console.log('showActionSheet e:', e)
                            console.log('data:', this.$data)
                            if (e.tapIndex === 0) {
                                
                            } else if (e.tapIndex === 1) {
                                
                            }
                        }
                    })
                }                         
            },
            goods_nav_buttonClick(e) {
                console.log('goods_nav_buttonClick e:', e)
                if (e.index === 0) {
                    uni.navigateTo({
                        url: './loc_new'
                    })
                }
            }
        }
    }
</script>

<style>

</style>
