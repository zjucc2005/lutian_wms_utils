<template>
    <view>
        <uni-table ref="table" :loading="loading" border stripe type="selection" @selection-change="selectionChange">
            <uni-tr>
                <uni-th v-for="(val, key) in model.fields" :key="key" align="center">
                    <text>{{ val }}</text>
                </uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in tableData" :key="index" @click="showDetail(item)">
                <uni-td v-for="(val, key) in model.fields" :key="key" align="center">{{ item[key] }}</uni-td>
            </uni-tr>
        </uni-table>
        <uni-pagination show-icon :page-size="per_page" :current="page" :total="total" @change="pageChange" />
    </view>
</template>

<script>
    import K3CloudApi from '@/utils/k3cloudapi'
    import model from '@/utils/model'
    export default {
        data() {
            return {
                loading: true,
                tableData: [],
                model_name: 'BD_EMPINFO',
                model: model.BD_EMPINFO,
                page: 1,
                per_page: 10,
                total: 10000
            }
        },
        mounted() {
            this.loadData()
        },
        methods: {
            loadData() {
                this.loading = true;
                const params = {
                    FormId: this.model_name,
                    StartRow: this.per_page * (this.page - 1),
                    Limit: this.per_page,
                    // FilterString: [{"Left":"","FieldName":"FName","Compare":"17","Value":"罗","Right":"","Logic":0}],
                    OrderString: "FID DESC"
                }
                K3CloudApi.bill_query(params).then(res => {
                    console.log(`${this.model_name} page res:`, res)
                    this.tableData = res;
                    this.loading = false;
                })
            },
            selectionChange(e) {
                console.log('selectionChange e:', e)
            },
            pageChange(e) {
                this.page = e.current;
                this.loadData()
            },
            showDetail(item) {
                const params = {
                    Id: item.FID,
                    // Number: item.FStaffNumber,
                }
                K3CloudApi.view(this.model_name, params)
            }
        }
    }
</script>

<style>

</style>
