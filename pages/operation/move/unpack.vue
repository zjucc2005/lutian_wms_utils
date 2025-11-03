<template>
    <uni-section title="查询单据编号" type="square" sub-title="生产发料通知单" sub-title-color="#007aff" class="above-uni-goods-nav">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" 
                placeholder="请输入单据编号"
                prefix-icon="scan"
                @confirm="handle_search"
                @clear="handle_search"
                @icon-click="searchbar_icon_click"
                primary-color="rgb(238, 238, 238)"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)'
                }"
            />
        </view>
    </uni-section>
    
    
    
    <view v-if="$store.state.screen_type === 'app-plus'" class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import scan_code from '@/utils/scan_code'
    import K3CloudApi from '@/utils/k3cloudapi'
    export default {
        data() {
            return {
                raw_data: {},
                search_form: {
                    bill_no: ''
                },
                goods_nav: {
                    options: [
                        // { icon: 'cart', text: '计划', info: '' }
                    ],
                    button_group: [
                        {
                            text: '扫码查询单据',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        methods: {
            // 页面动作
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            // 搜索
            handle_search() {
                // console.log('handle search')
                this.load_scfltzd()
            },
            // ** 加载数据 **
            async load_scfltzd() {
                try {
                    // this.no = ''
                    // if (this.bills.some(x => x.bill_no == bill_no)) {
                    //     uni.showToast({ icon: 'none', title: '重复添加单据' })
                    //     return
                    // }
                    uni.showLoading({ title: 'Loading' })
                    let res = await K3CloudApi.view('PRD_ISSUEMTRNOTICE', { Number: this.search_form.bill_no })
                    this.raw_data = res.data
                    uni.hideLoading()
                    // if (res.data.Result.ResponseStatus.IsSuccess) {
                    //     let raw_data = res.data.Result.Result
                    //     if (raw_data.PrdOrgId_Id != store.state.cur_stock.FUseOrgId) {
                    //         uni.showToast({ icon: 'none', title: '生产组织不一致' })
                    //         return
                    //     }
                    //     let materials = []
                    //     for (let entity of raw_data.SUMEntity) {
                    //         materials.push({
                    //             material_id: entity.ChildMtr.Id,
                    //             material_no: entity.ChildMtr.Number,
                    //             material_name: entity.ChildMtr.Name[0]?.Value,
                    //             material_spec: entity.ChildMtr.Specification[0]?.Value,
                    //             base_unit_qty: entity.BasePlanIssueQty,
                    //             base_unit_name: entity.BaseSumUnitId.Name[0]?.Value,
                    //             unit_qty: entity.PlanIssueQty,
                    //             unit_name: entity.SumUnitId.Name[0].Value
                    //         })
                    //     }
                    //     // this.bills_raw.push(raw_data)
                    //     this.bills_add({
                    //         category: 'scfltzd',
                    //         bill_no: raw_data.BillNo,
                    //         mo_bill_no: raw_data.MOBillNO,
                    //         materials: materials
                    //     })
                    // } else {
                    //     uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    // }
                } catch (err) { }
            },
        }
    }
</script>

<style>

</style>
