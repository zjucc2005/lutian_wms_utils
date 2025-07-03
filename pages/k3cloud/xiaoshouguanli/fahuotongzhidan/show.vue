<template>
    <uni-section title="基本信息" type="square">
        <view v-if="$store.state.system_info.windowWidth >= 1200">
            <uni-row :gutter="30">
                <uni-col :md="4" :sm="12" :xs="24">
                    <uni-list>
                        <uni-list-item title="单据类型" :right-text="delivery_notice.BillTypeID?.Name[0]?.Value" />
                        <uni-list-item title="单据编号" :right-text="delivery_notice.BillNo" />
                        <uni-list-item title="日期" :right-text="formatDate(delivery_notice.Date, 'yyyy-MM-dd')" />
                        <uni-list-item title="出货日期" :right-text="formatDate(delivery_notice.F_PAEZ_Date, 'yyyy-MM-dd')" />
                        <uni-list-item title="销售组织" :right-text="delivery_notice.SaleOrgId?.Name[0]?.Value" />
                        <uni-list-item title="销售部门" :right-text="delivery_notice.SaleDeptID?.Name[0]?.Value" />
                    </uni-list>
                </uni-col>
                <uni-col :md="4" :sm="12" :xs="24">
                    <uni-list>
                        <uni-list-item title="客户简称" :right-text="delivery_notice.ReceiverID?.ShortName[0]?.Value" />
                        <uni-list-item title="交货方式" :right-text="delivery_notice.HeadDeliveryWay?.Name[0]?.Value" />
                        <uni-list-item title="客户编码" :right-text="delivery_notice.ReceiverID?.Number" />
                    </uni-list>
                </uni-col>
                <uni-col :md="4" :sm="12" :xs="24">
                    <uni-list>
                        <uni-list-item title="发货组织" :right-text="delivery_notice.DeliveryOrgID?.Name[0]?.Value" />
                        <uni-list-item title="发货部门" :right-text="delivery_notice.DeliveryDeptID?.Name[0]?.Value" />
                        <uni-list-item title="库存组" :right-text="delivery_notice.StockerGroupID?.Name[0]?.Value" />
                        <uni-list-item title="仓管员" :right-text="delivery_notice.StockerID?.Name[0]?.Value" />
                        <uni-list-item title="销售组" :right-text="delivery_notice.SaleGroupID?.Name[0]?.Value" />
                        <uni-list-item title="销售员" :right-text="delivery_notice.SalesManID?.Name[0]?.Value" />
                    </uni-list>
                </uni-col>
                <uni-col :md="4" :sm="12" :xs="24">
                    <uni-list>
                        <uni-list-item title="收货人" :right-text="delivery_notice.F_PAEZ_Text" />
                        <uni-list-item title="经办人" :right-text="delivery_notice.F_PAEZ_Text2" />
                        <uni-list-item title="零售户" :right-text="delivery_notice.F_PAEZ_Text4" />
                        <uni-list-item title="摘要" :right-text="delivery_notice.F_PAEZ_Text6" />
                        <uni-list-item title="打印次数" :right-text="delivery_notice.F_PAEZ_PrintTimes?.toString()" />
                    </uni-list>
                </uni-col>
                <uni-col :md="4" :sm="12" :xs="24">
                    <uni-list>
                        <uni-list-item title="售后客户名称" :right-text="delivery_notice.F_PAEZ_Base?.Name[0]?.Value" />
                        <uni-list-item title="客户类别" :right-text="delivery_notice.F_PAEZ_Combo7" />
                        <uni-list-item title="打印时间" :right-text="formatDate(delivery_notice.F_PAEZ_PrintDateTime, 'yyyy-MM-dd hh:mm:ss')" />
                        <uni-list-item title="单据状态" :right-text="$store.state.document_status_dict[delivery_notice.DocumentStatus]" />
                        <uni-list-item title="关闭状态" :right-text="$store.state.close_status_dict[delivery_notice.CLOSESTATUS]" />
                    </uni-list>
                </uni-col>
            </uni-row>
            <uni-row :gutter="30" class="uni-mt-5">
                <uni-col :md="12" :sm="24" :xs="24">
                    <uni-list>
                        <uni-list-item title="合同号" :right-text="delivery_notice.F_PAEZ_Text7" />
                        <uni-list-item title="快递信息" :right-text="delivery_notice.F_PAEZ_Text18" />
                        <uni-list-item title="装柜特殊要求" :right-text="delivery_notice.F_PAEZ_Remarks" />
                        <uni-list-item title="备注" :right-text="delivery_notice.Note" />
                    </uni-list>
                </uni-col>
            </uni-row>
        </view>
        <uni-list v-else>
            <uni-list-item title="单据类型" :right-text="delivery_notice.BillTypeID?.Name[0]?.Value" />
            <uni-list-item title="单据编号" :right-text="delivery_notice.BillNo" />
            <uni-list-item title="日期" :right-text="formatDate(delivery_notice.Date, 'yyyy-MM-dd')" />
            <uni-list-item title="发货组织" :right-text="delivery_notice.DeliveryOrgID?.Name[0]?.Value" />
            <uni-list-item title="收货人" :right-text="delivery_notice.F_PAEZ_Text" />
            <uni-list-item title="关闭状态" :right-text="$store.state.close_status_dict[delivery_notice.CLOSESTATUS]" />
        </uni-list>
    </uni-section>
    <uni-section title="明细信息" type="square">
        <uni-table v-if="$store.state.system_info.windowWidth >= 1200" ref="table" border stripe>
            <!-- H5 -->
            <uni-tr>
                <uni-th align="center">序号</uni-th>
                <uni-th align="center">订单单号</uni-th>
                <uni-th align="center">表体发货组织</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">销售单位</uni-th>
                <uni-th align="center">销售数量</uni-th>
                <uni-th align="center">是否赠品</uni-th>
                <uni-th align="center">税率%</uni-th>
                <uni-th align="center">要货日期</uni-th>
                <uni-th align="center">出货仓库</uni-th>
                <uni-th align="center">备注</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in delivery_notice.SAL_DELIVERYNOTICEENTRY" :key="index">
                <uni-td align="center">{{ obj.Seq }}</uni-td>
                <uni-td>{{ obj.OrderNo }}</uni-td>
                <uni-td>{{ obj.F_PAEZ_OrgId.Name[0]?.Value }}</uni-td>
                <uni-td>{{ obj.MaterialID.Number }}</uni-td>
                <uni-td>{{ obj.MaterialID.Name[0]?.Value }}</uni-td>
                <uni-td>{{ obj.MaterialID.Specification[0]?.Value }}</uni-td>
                <uni-td>{{ obj.UnitID.Name[0]?.Value }}</uni-td>
                <uni-td>{{ obj.Qty }}</uni-td>
                <uni-td>{{ obj.IsFree ? '是' : '否'}}</uni-td>
                <uni-td>{{ obj.TaxRate }}</uni-td>
                <uni-td>{{ formatDate(obj.DeliveryDate, 'yyyy-MM-dd') }}</uni-td>
                <uni-td>{{ obj.StockID.Name[0]?.Value }}</uni-td>
                <uni-td>{{ obj.NoteEntry }}</uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <!-- APP-PLUS -->
            <uni-list-item
                v-for="(obj, index) in delivery_notice.SAL_DELIVERYNOTICEENTRY"
                :key="index"
                >
                <template v-slot:body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.MaterialID.Number }}</text>
                        <view class="note">
                            <view>名称：{{ obj.MaterialID.Name[0]?.Value }}</view> 
                            <view>规格：{{ obj.MaterialID.Specification[0]?.Value }}</view>
                            <view>出货仓库：{{ obj.StockID.Name[0]?.Value }}</view>
                            <view>要货日期：{{ formatDate(obj.DeliveryDate, 'yyyy-MM-dd') }}</view>
                        </view>
                    </view>
                </template>
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <text>{{ obj.Qty }} {{ obj.UnitID.Name[0]?.Value }}</text>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
</template>

<script>
    import { SalDeliveryNotice } from '@/utils/model'
    import { formatDate } from '@/utils'
    export default {
        props: {
            id: {
                type: String
            }
        },
        data() {
            return {
                delivery_notice: {}
            }
        },
        onLoad(options) {
            if (options.id) {
                this.load_delivery_notice(options.id)
            }
        },
        methods: {
            formatDate,
            async load_delivery_notice(id) {
                uni.showLoading({ title: 'Loading' })
                let res = await SalDeliveryNotice.view(id)
                this.delivery_notice = res.data.Result.Result
                uni.hideLoading()
            }
        }
    }
</script>

<style lang="scss">
    .uni-input-input::v-deep {
        color: $uni-text-color;
    }
</style>
