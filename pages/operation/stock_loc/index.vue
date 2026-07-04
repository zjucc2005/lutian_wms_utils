<template>
    <uni-row v-if="$store.state.screen_type === 'h5'">
        <uni-col :span="6">
            <uni-section title="工具栏" type="square" sub-title="搜索&更新" class="container above-uni-goods-nav">
                <uni-forms ref="search_form" :model="search_form" >
                    <uni-forms-item label="编码">
                        <uni-easyinput v-model="search_form.no" />
                    </uni-forms-item>
                    <uni-forms-item label="库位备注">
                        <uni-easyinput v-model="search_form.remark" />
                    </uni-forms-item>
                    <uni-forms-item label="禁用状态">
                        <uni-data-select v-model="search_form.forbid_status" :localdata="[{ value: 'B', text: '是' },{ value: 'A', text: '否' }]" />
                    </uni-forms-item>
                </uni-forms>
                <button type="primary" @click="search">搜索</button>
                <hr class="uni-mt-10" />
                <button @click="debug" class="uni-mt-10">修改库位备注</button>
                <button @click="debug" class="uni-mt-10">DEBUG</button>
            </uni-section>
        </uni-col>
        
        <uni-col :span="18">
            <uni-section title="当前仓库" type="square"
                :sub-title="breadcrumb_stockname()"
                sub-title-color="#007aff"
                class="above-uni-goods-nav"
                @click="$logger.info('>>> $data', $data)"
                >
                <uni-table ref="table" type="selection" border stripe class="cc-table-scroll">
                    <uni-tr>
                        <uni-th align="center">编码</uni-th>
                        <uni-th align="center">分组</uni-th>
                        <uni-th align="center">横向位置</uni-th>
                        <uni-th align="center">纵向位置</uni-th>
                        <uni-th align="center">位数</uni-th>
                        <uni-th align="center">库位备注</uni-th>
                        <uni-th align="center">禁用状态</uni-th>
                    </uni-tr>
                    <uni-tr v-for="(loc, index) in stock_locs" :key="index">
                        <uni-td align="center">{{ loc.FNumber }}</uni-td>
                        <uni-td align="center">{{ loc.FGroup }}</uni-td>
                        <uni-td align="center">{{ loc.FPosX }}</uni-td>
                        <uni-td align="center">{{ loc.FPosY }}</uni-td>
                        <uni-td align="center">{{ loc.FPalletPlace }}</uni-td>
                        <uni-td align="center">{{ loc.FRemark }}</uni-td>
                        <uni-td align="center">{{ loc.FForbidStatus == 'B' ? '是' : '否' }}</uni-td>
                    </uni-tr>
                </uni-table>
            </uni-section>
        </uni-col>
    </uni-row>
    
    <uni-section v-else title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        @click="$logger.info('>>> $data', $data)"
        >
        <!-- <cc-shelf
            :stock_locs="$store.state.stock_locs"
            :invs="invs"
            :open="cc_shelf_open"
            forbidable
            /> -->
        
        
        <!-- <uni-list v-else> -->
            <uni-list-item v-for="(loc, index) in stock_locs" :key="index" :title="loc.FNumber" :right-text="loc.FRemark"></uni-list-item>
        <!-- </uni-list> -->
    </uni-section>
</template>

<script>
    import store from '@/store'
    // import { Inv, StockLoc } from '@/utils/model'
    import { breadcrumb_stockname, play_audio_prompt, link_to } from '@/utils'
    
    export default {
        data() {
            return {
                stock_locs: store.state.stock_locs,
                search_form: {
                    
                }
            }
        },
        methods: {
            breadcrumb_stockname,
            search() {
                
            },
            debug() {
                console.log('$refs.table', this.$refs.table)
                console.log('$refs.table.action', this.$refs.table.backIndexData)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .cc-table-scroll {
        width: 100%;
        overflow-x: auto;
        height: calc(100vh - 107px);
    }
</style>
