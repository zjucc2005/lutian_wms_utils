<template>
    <uni-notice-bar single scrollable text="本功能建议仅在初始化库存时使用" />
    <uni-section title="期初库存(草稿)" type="square"
        class="above-uni-goods-nav">
        
    </uni-section>
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            @click="goods_nav_click"
            @button-click="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { get_all_bd_materials } from '@/utils/api'
    export default {
        data() {
            return {
                bd_materials: [],
                new_invs: [
                    { material_no: '' }
                ],
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' },
                    ],
                    button_group: [
                        {
                            text: 'DEBUG',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            
        },
        methods: {
            goods_nav_click(e) {
                // if (e.index === 0) this.refresh() // btn:刷新
                if (e.index === 0) this.load_bd_materials()
            },
            goods_nav_button_click(e) {
                // if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 0) console.log('this.$data', this.$data)
            },
            async load_bd_materials() {
                uni.showLoading({ title: 'Loading' })
                return get_all_bd_materials(store.state.cur_stock.FUseOrgId).then(res => {
                    uni.hideLoading()
                    this.bd_materials = res
                })
            }
        }
    }
</script>

<style lang="scss">

</style>
