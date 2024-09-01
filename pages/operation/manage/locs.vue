<template>
    <view>
        <uni-section
            title="库位列表"
            :sub-title="`${cur_stock['FGroup.FName']}/${cur_stock.FName}`"
            type="line"
            style="padding-bottom: 60px;"
        >
            <uni-list>
            	<uni-list-item 
                    v-for="c_stock_loc in c_stock_locs"
                    :key="c_stock_loc.FID"
                    :title="c_stock_loc.FNumber"
                />
            </uni-list>   
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
    import { get_c_stock_locs } from '@/utils/api'
    export default {
        data() {
            return {
                cur_stock: {},
                c_stock_locs: [],
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
