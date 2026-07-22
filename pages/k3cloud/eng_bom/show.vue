<template>
    <view class="above-uni-goods-nav">
        <uni-list v-for="(bom, index) in boms" :key="index">
            <tree-node :node="bom" />
        </uni-list>
    </view>
    
    <!-- <button type="warn" @click="debug">debug</button> -->
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="$refs.search_dialog.close()"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view style="flex: 1;">
                <uni-forms ref="search_form" :model="search_form" label-width="auto">
                    <uni-forms-item label="BOM版本">
                        <uni-easyinput v-model="search_form.bomver" trim />
                    </uni-forms-item>
                    <uni-forms-item label="物料编码">
                        <uni-easyinput v-model="search_form.no" trim />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import TreeNode from './tree_node.vue';
    import { get_bomid, load_bom_children } from './helper';
    
    import { EngBom } from '@/utils/model';
    export default {
        components: {
            TreeNode
        },
        props: {
            no: {
                type: String
            }
        },
        data() {
            return {
                boms: [],
                search_form: {
                    // bomver: '3.12.02.25.0007_V1.000',
                    no: '3.12.02.25.0007'
                },
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索' },
                        { icon: 'arrow-up', text: '回到顶部' }
                    ],
                    button_group: [
                        // { text: '扫码查询', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                    ]
                }
            }
        },
        onLoad(options) {
            if (options.no) {
                this.search_form = { no: options.no }
                this.search()
            }
        },
        mounted() {            
        },
        methods: {
            debug() {
                // this.test_data.children[0].material_name = 'lalala'
                this.$logger.info('>>>', this.$data)
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) uni.pageScrollTo({ scrollTop: 0 })
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code()
            },
            search_dialog_confirm() {
                this.$refs.search_dialog.close()
                this.search()
            },
            async search() {
                await this.load_boms()
            },
            // 加载BOM列表
            async load_boms() {
                let options = {}
                if (this.search_form.bomver) options['FNumber'] = this.search_form.bomver
                if (this.search_form.no) options['FMaterialId.FNumber'] = this.search_form.no
                let meta = {
                    fields: ['FID', 'FNumber', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName']
                }
                let res = await EngBom.query(options, meta)
                let boms = []
                for (let d of res.data) {
                    boms.push({
                        bomid: d['FID'],
                        bomver: d['FNumber'],
                        no: d['FMaterialId.FNumber'], 
                        name: d['FMaterialId.FName'],
                        spec: d['FMaterialId.FSpecification'],
                        unit: d['FUnitId.FName'],
                        numerator: 1,
                        denominator: 1,
                        is_root: true,
                        is_open: false,
                        is_load: false,
                        children: []
                    })
                }
                this.boms = boms
            },
            // // 加载BOM清单
            // async load_bom_children(id) {
            //     let meta = {
            //         fields: ['FBomId', 'FBomId.FNumber', 'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FSpecification', 
            //                  'FChildUnitId.FName', 'FNumerator', 'FDenominator', 'FChildItemProperty' ],
            //         order: 'FReplaceGroup ASC'
            //     }
            //     let res = await EngBom.query({ FID: id }, meta)
            //     let bom = []
            //     for (let d of res.data) {
            //         bom.push({
            //             bomid: d['FBomId'],
            //             bomver: d['FBomId.FNumber'],
            //             no: d['FMaterialIdChild.FNumber'],
            //             name: d['FMaterialIdChild.FName'],
            //             spec: d['FMaterialIdChild.FSpecification'],
            //             unit: d['FChildUnitId.FName'],
            //             numerator: d['FNumerator'],
            //             denominator: d['FDenominator'],
            //             prop: d['FChildItemProperty'],
            //             is_root: false,
            //             is_open: false,
            //             is_load: d['FChildItemProperty'] == '1'
            //         })
            //     }
            //     return bom
            // }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
    .uni-list {
        background-color: #ccc;
    }
</style>
