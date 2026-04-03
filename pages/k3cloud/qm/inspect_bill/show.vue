<template>
    <uni-section title="基本" type="square">
        <uni-list>
            <uni-list-item title="单据编号" :right-text="inspect_bill.BillNo" />
            <uni-list-item title="单据类型" :right-text="inspect_bill.FBillTypeID?.Name[0]?.Value" />
            <uni-list-item title="单据日期" :right-text="formatDate(inspect_bill.FDate, 'yyyy-MM-dd')" />
            <uni-list-item title="质检组织" :right-text="inspect_bill.InspectOrgId?.Name[0]?.Value" />
            <uni-list-item title="来源组织" :right-text="inspect_bill.SourceOrgId?.Name[0]?.Value" />
            <uni-list-item title="检验部门" :right-text="inspect_bill.InspectDepId?.Name[0]?.Value" />
            <uni-list-item title="单据状态" :right-text="$store.state.document_status_dict[inspect_bill.DocumentStatus]" />
            <uni-list-item title="质检组" :right-text="inspect_bill.InspectGroupId?.Name[0]?.Value" />
            <uni-list-item title="质检员" :right-text="inspect_bill.InspectorId?.Name[0]?.Value" />
        </uni-list>
    </uni-section>
    
    <uni-section title="分录明细" type="square">
        <uni-list>
            <uni-list-item v-for="(obj, index) in inspect_bill.Entity" :key="index">
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">{{ obj.MaterialId.Number }} / {{ obj.MaterialId.Name[0]?.Value }}</view>
                        <view class="note">
                            <view>规格型号：{{ obj.MaterialId.Specification[0]?.Value }}</view>
                            <view>检验数量：{{ obj.InspectQty }}</view>
                            <view>合格数：<text class="text-primary">{{ obj.QualifiedQty }}</text></view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ qc_status_dict[obj.QCStatus] }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { QmInspectBill } from '@/utils/model'
    import { formatDate, link_to } from '@/utils'
    
    export default {
        props: {
            bill_no: {
                type: String
            }
        },
        data() {
            return {
                inspect_bill: {},
                qc_status_dict: { '1': '计划', '2': '质检开始', '3': '质检完成' }
            }
        },
        onLoad(options) {
            if (options.bill_no) {
                this.load_inspect_bill(options.bill_no)
            }
        },
        mounted() {
        },
        methods: {
            formatDate,
            async load_inspect_bill(bill_no) {
                let res = await QmInspectBill.view(bill_no)
                this.inspect_bill = res.data.Result.Result
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-list-item::v-deep {
        .uni-list-item__container {
            padding: 9px 15px;
        }
        .uni-list-item__extra-text {
            color: $uni-color-primary;
        }
    }
</style>
