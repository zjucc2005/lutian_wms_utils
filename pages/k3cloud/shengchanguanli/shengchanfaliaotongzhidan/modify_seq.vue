<template>
    <uni-section title="查询单据编号" type="square" @click="$logger.info('>>>', $data)">
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
    
    <uni-section title="生产订单" type="square">
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">原序号</uni-th>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center">生产订单编号</uni-th>
                <uni-th align="center">产品编码</uni-th>
                <uni-th align="center">产品名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">生产数量</uni-th>
                <uni-th align="center">已发料通知套数</uni-th>
                <uni-th align="center">本次发料套数</uni-th>
                <uni-th align="center">计划开工时间</uni-th>
                <uni-th align="center">计划跟踪号</uni-th>
                <uni-th align="center">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(e, index) in entity" :key="index">
                <uni-td align="center">{{ e.seq }}</uni-td>
                <uni-td align="center">{{ e.new_seq }}</uni-td>
                <uni-td>{{ e.mo_bill_no }}</uni-td>
                <uni-td>{{ e.material_no }}</uni-td>
                <uni-td>{{ e.material_name }}</uni-td>
                <uni-td>{{ e.material_spec }}</uni-td>
                <uni-td align="center">{{ e.unit_name }}</uni-td>
                <uni-td align="center">{{ e.prd_qty }}</uni-td>
                <uni-td align="center">{{ e.issue_noticed_qty }}</uni-td>
                <uni-td align="center">{{ e.issue_notice_qty }}</uni-td>
                <uni-td align="center">{{ e.plan_start_date }}</uni-td>
                <uni-td align="center">{{ e.mto_no }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="\\e62a" type="primary" />
                    <uni-tag text="下移" type="primary" class="uni-ml-2" />
                </uni-td>
            </uni-tr>
        </uni-table>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import scan_code from '@/utils/scan_code'
    import { PrdIssueMtrNotice } from '@/utils/model'
    export default {
        data() {
            return {
                bill: {},          // raw_data, 生产发料通知单
                entity: [],        // 生产订单
                detail_entity: [], // 子项明细
                search_form: {
                    bill_no: ''
                },
            }
        },
        methods: {
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
            async handle_search() {
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'SCFLTZD' + this.search_form.bill_no // 自动补充前缀
                    }
                    await this.load_scfl()
                } else {
                    this.bill = {}
                }
            },
            async load_scfl() {
                uni.showLoading({ title: 'Loading' })
                let res = await PrdIssueMtrNotice.view(this.search_form.bill_no)
                uni.hideLoading()
                if (res.data?.Result?.ResponseStatus?.IsSuccess) {
                    this.bill = res.data.Result.Result
                    this.handle_raw_data()
                } else {
                    uni.showToast({ icon: 'none', title: '未找到单据' })
                }
            },
            // 处理生数据
            handle_raw_data() {
                let entity = []
                let detail_entity = []
                for (let e of this.bill.Entity) {
                    entity.push({
                        id: e.Id,
                        seq: e.Seq,
                        new_seq: e.Seq,
                        mo_bill_no: e.MOBILLNO,
                        mto_no: e.MToNo,
                        material_no: e.PrdMaterialId.Number,
                        material_name: e.PrdMaterialId.Name[0]?.Value,
                        material_spec: e.PrdMaterialId.Specification[0]?.Value,
                        unit_name: e.UnitID.Name[0]?.Value,
                        prd_qty: e.PrdQty,
                        issue_notice_qty: e.IssueNoticeQty,
                        issue_noticed_qty: e.IssueNoticedQty,
                        plan_start_date: e.PlanStartDate.split('T')[0]
                    })
                }
                
                this.entity = entity
                this.detail_entity = detail_entity
            }
        }
    }
</script>

<style>
           
</style>
