<template>
    <uni-list-item 
        :extra-icon="{color:  node.children?.length || !node.is_load ? '#007aff' : 'rgba(0,0,0,0)', size: '16', type: 'right'}" show-extra-icon
        @click="node_click(node)" clickable
        :class="{ 'is-open': node.is_open }"
        >
        <template #body>
            <view class="uni-list-item__body">
                <view class="title">
                    <uni-row>
                        <uni-col :md="8"><view class="text-bold">{{ node.no }} {{ node.name }}</view></uni-col>
                        <uni-col :md="16"><view class="note">{{ node.spec }}</view></uni-col>
                    </uni-row>
                </view>
                <view class="note">
                    <!-- <view>{{ node.spec }}</view> -->
                    <view v-if="node.is_root">版本：<text class="text-primary">{{ node.bomver }}</text></view>
                </view>
            </view>
        </template>
        <template #footer>
            <view class="uni-list-item__foot">
                <uni-icons v-if="node.is_root" type="star-filled" size="20" color="#f0ad4e"></uni-icons>
                <view v-else>{{ node.denominator == 1 ? node.numerator : [node.numerator, node.denominator].join(' / ') }} {{ node.unit }}</view>
            </view>
        </template>
    </uni-list-item>
    <view v-if="node.is_open && node.children?.length" class="uni-pl-5">
        <tree-node v-for="(cnode, index) in node.children" :key="index" :node="cnode" />
    </view>
</template>

<script>
    import { get_bomid, load_bom_children } from './helper';
    // import { EngBom } from '@/utils/model';
    
    export default {
        name: 'tree-node',
        emits: ['click'],
        props: {
            node: Object
        },
        methods: {
            // _click() {
            //     this.$emit('click', {})
            // },
            async node_click(node) {
                node.is_open = !node.is_open
                if (node.is_load) return
                let bomid = node.bomid
                if (!bomid) bomid = await get_bomid(node.no)
                if (bomid) node.children = await load_bom_children(bomid)
                node.is_load = true
            },
            // async get_bomid(no) {
            //     let options = { 'FMaterialId.FNumber': no }
            //     let meta = {
            //         fields: ['FID', 'FNumber', 'FMaterialId.FNumber'],
            //         order: 'FNumber DESC'
            //     }
            //     let res = await EngBom.query(options, meta)
            //     return res.data.length ? res.data[0]['FID'] : 0
            // },
            // // 加载BOM清单
            // async load_bom_children(id) {
            //     let meta = {
            //         fields: ['FBomId', 'FBomId.FNumber', 'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FSpecification', 
            //                  'FChildUnitId.FName', 'FNumerator', 'FDenominator', 'FChildItemProperty' ],
            //         order: 'FReplaceGroup ASC'
            //     }
            //     uni.showLoading({ title: 'Loading' })
            //     let res = await EngBom.query({ FID: id }, meta)
            //     uni.hideLoading()
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
            //             is_load: d['FChildItemProperty'] == '1', // 外购无子级
            //             children: []
            //         })
            //     }
            //     return bom
            // }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-list-item::v-deep {
        .uni-list-item__container {
            padding: 4px 8px;
        }
        .uni-list-item__icon {
            font-weight: 600;
            transform: rotate(0deg);
            transition: transform 0.3s ease;
        }
    }
    .uni-list-item.is-open::v-deep {
        .uni-list-item__icon {
            transform: rotate(90deg);
        }
    }
    .uni-list-item__body {
        .note {
            margin-top: 0;
        }
    }
</style>
