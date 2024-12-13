<template>
    <uni-list>
        <uni-list-item
            v-for="(eng_bom, index) in eng_boms"
            :key="index"
            show-arrow
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ eng_bom.FNumber }}</view>
                    <view class="note">
                        <view>使用组织：{{ eng_bom['FUseOrgId.FName'] }}</view>
                        <!-- <view>BOM分类：{{ eng_bom.FBomCategory }}</view> -->
                        <view>物料名称：{{ eng_bom.FItemName }}</view>
                        <view>规格型号：{{ eng_bom.FItemModel }}</view>
                        <view>工序：{{ eng_bom.FOperId }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <!-- <view v-if="['in', 'add'].includes(inv_plan.FOpType)" class="text-error">{{ op_type_dict[inv_plan.FOpType] }}</view>
                    <view v-if="['out', 'sub'].includes(inv_plan.FOpType)" class="text-primary">{{ op_type_dict[inv_plan.FOpType] }}</view>
                    <view v-if="['mv'].includes(inv_plan.FOpType)">{{ op_type_dict[inv_plan.FOpType] }}</view>
                    <view>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</view>
                    <view class="text-primary">{{ $store.state.document_status_dict[inv_plan.FDocumentStatu] }}</view> -->
                </view>
            </template>
        </uni-list-item>
    </uni-list>

    <!-- <uni-load-more :status="load_more_status" @clickLoadMore="load_more" /> -->
</template>

<script>
    import { EngBom } from '@/utils/model';
    export default {
        data() {
            return {
                eng_boms: [],
                page: 1,
                per_page: 100,
                load_more_status: 'more', // more,loading,nomore
            }
        },
        mounted() {
            let options = {
                    
            }
            EngBom.query(options, { page: this.page, per_page: this.per_page }).then(res => {
                this.eng_boms = res.data
            })
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
