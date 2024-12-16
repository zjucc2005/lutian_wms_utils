<template>
    <uni-section
        :title="_props.sup == 'true' ? '查询父项物料' : '查询子项物料'"
        :sub-title="_props.material_no"
        type="square">
        <view class="container">
            <uni-load-more v-if="tree_data.length === 0" status="nomore" />
            <view v-for="(obj, index) in tree_data" :key="index" class="cc-tree-card">
                <view class="cc-tree-card-item">
                    <view class="cc-tree-card-item__section">
                        <view class="cc-tree-card-item__card" @click="toggle(obj)">
                            <view class="cc-tree-card-item__body">
                                <view class="title">{{ obj.material_no }} / <text class="text-primary">{{ obj.bom_no }}</text></view>
                                <view class="note">名称：{{ obj.material_name }}</view>
                                <view class="note">规格：{{ obj.material_spec }}</view>
                                <view class="note">使用组织：{{ obj.use_org_name }}</view>
                            </view>
                            <view class="cc-tree-card-item__foot">
                                <view v-if="obj.loaded" class="text-primary text-bold">{{ obj.children.length }} 子项</view>
                                <view v-else>展开子项</view>
                            </view>
                            <view class="cc-tree-card-item__arrow" :class="{ 'cc-tree-card-item__arrow-active': obj.open }">
                                <uni-icons type="bottom" size="14" color="#999" />
                            </view>
                        </view>
                    </view>
                    
                    <view v-if="obj.open" class="cc-tree-card__sub">
                        <view v-for="(child, child_index) in obj.children" :key="child_index" class="cc-tree-card-item">
                            <view class="vertical-line"></view>
                            <view class="cc-tree-card-item__section">
                                <view class="horizontal-line"></view>
                                <view class="cc-tree-card-item__card" @click="child.bom_id ? search_bom(child.bom_id, child.material_no) : ''">
                                    <view class="cc-tree-card-item__body">
                                        <view v-if="child.bom_id" class="title">{{ child.material_no }} / <text class="text-primary">{{ child.bom_no }}</text></view>
                                        <view v-else class="title">{{ child.material_no }}</view>
                                        <view class="note">名称：{{ child.material_name }}</view>
                                        <view class="note">规格：{{ child.material_spec }}</view>
                                    </view>
                                    <view class="cc-tree-card-item__foot">
                                        <view>{{ child.denominator == 1 ? child.numerator : [child.numerator, child.denominator].join(' / ') }} {{ child.unit_name }}</view>
                                    </view>
                                    <view v-if="child.bom_id" class="cc-tree-card-item__arrow">
                                        <uni-icons type="right" size="14" color="#999" />
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </uni-section>
</template>

<script>
    import { link_to } from '@/utils'
    import { EngBom } from '@/utils/model'
    export default {
        props: {
            bom_id: {
                type: String
            },
            material_no: {
                type: String
            },
            sup: {
                type: String,
                default: 'false'
            }
        },
        data() {
            return {
                _props: {},
                tree_data: [], // { bom_id, bom_no, material_id, material_no, material_name, material_spec }
            }
        },
        onLoad(options) {
            this._props = options
            if (options.bom_id) {
                this.load_eng_bom(options.bom_id)
            }
            else if (options.material_no) {
                this.load_eng_boms(options.material_no, options.sup)
            }
        },
        mounted() {
            // this.load_eng_boms('2.05.02.01.03.0003')
        },
        methods: {
            search_bom(bom_id, material_no) {
                link_to(`/pages/k3cloud/eng_bom/tree?bom_id=${bom_id}&material_no=${material_no}&sup=false`)
            },
            toggle(obj) {
                obj.open = !obj.open
                if (obj.open && !obj.loaded) {
                    this.load_children(obj)
                }
            },
            async load_children(obj) {
                uni.showLoading({ title: 'Loading' })
                let view_res = await EngBom.view(obj.bom_id)
                uni.hideLoading()
                obj.children = this._handle_eng_bom_children(view_res)
                obj.open = true
                obj.loaded = true
            },
            // tree中查询子项时，用bom_id精准查询
            async load_eng_bom(bom_id) {
                uni.showLoading({ title: 'Loading' })
                let view_res = await EngBom.view(bom_id)
                uni.hideLoading()
                this.tree_data = this._handle_eng_bom(view_res)
            },
            // 通用查询，返回数据根据组织归类
            async load_eng_boms(material_no, sup) {
                let options = { 'FForbidStatus': 'A' }
                if (sup == 'true') {
                    options['FMaterialIdChild.FNumber'] = material_no
                } else {
                    options['FMaterialId.FNumber'] = material_no
                }
                let meta = {}
                uni.showLoading({ title: 'Loading' })
                let q_res = await EngBom.query(options, meta)
                uni.hideLoading()
                let tree_data = []
                for (let d of q_res.data) {
                    if (!tree_data.some(x => x.bom_id == d.FID)) {
                        tree_data.push({
                            bom_id: d.FID,
                            bom_no: d.FNumber,
                            material_id: d.FMaterialId,
                            material_no: d['FMaterialId.FNumber'],
                            material_name: d.FItemName,
                            material_spec: d.FItemModel,
                            use_org_id: d.FUseOrgId,
                            use_org_name: d['FUseOrgId.FName'],
                            open: false,
                            loaded: false,
                            children: []
                        })
                    }
                }
                this.tree_data = tree_data
                // 只有一条父项数据时，自动展开其子项
                if (this.tree_data.length == 1) {
                    for (let obj of this.tree_data) {
                        await this.load_children(obj)
                    }
                }
            },
            _handle_eng_bom(response) {
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    let r = response.data.Result.Result
                    let bom = {
                        bom_id: r.Id,
                        bom_no: r.Number,
                        material_id: r.MATERIALID_Id,
                        material_no: r.MATERIALID.Number,
                        material_name: r.MATERIALID.Name[0].Value,
                        material_spec: r.MATERIALID.Specification[0].Value,
                        use_org_id: r.UseOrgId_Id,
                        use_org_name: r.UseOrgId.Name[0].Value,
                        open: true,
                        loaded: true,
                        children: []
                    } 
                    for (let entity of r.TreeEntity.sort((x,y) => x.Seq - y.Seq)) {
                        if (entity.CHILDUNITID_Id) {
                            bom.children.push({
                                bom_id: entity.BOMID_Id,
                                bom_no: entity.BOMID?.Number,
                                material_id: entity.MATERIALIDCHILD_Id,
                                material_no: entity.MATERIALIDCHILD.Number,
                                material_name: entity.MATERIALIDCHILD.Name[0].Value,
                                material_spec: entity.MATERIALIDCHILD.Specification[0].Value,
                                unit_id: entity.CHILDUNITID_Id,
                                unit_name: entity.CHILDUNITID.Name[0].Value,
                                numerator: entity.NUMERATOR,
                                denominator: entity.DENOMINATOR,
                            })
                        }
                    }
                    return [bom]
                }
                return []
            },
            _handle_eng_bom_children(response) {
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    let children = []
                    let r = response.data.Result.Result
                    for (let entity of r.TreeEntity.sort((x,y) => x.Seq - y.Seq)) {
                        if (entity.CHILDUNITID_Id) {
                            children.push({
                                bom_id: entity.BOMID_Id,
                                bom_no: entity.BOMID?.Number,
                                material_id: entity.MATERIALIDCHILD_Id,
                                material_no: entity.MATERIALIDCHILD.Number,
                                material_name: entity.MATERIALIDCHILD.Name[0].Value,
                                material_spec: entity.MATERIALIDCHILD.Specification[0].Value,
                                unit_id: entity.CHILDUNITID_Id,
                                unit_name: entity.CHILDUNITID.Name[0].Value,
                                numerator: entity.NUMERATOR,
                                denominator: entity.DENOMINATOR,
                            })
                        }
                    }
                    return children
                }
                return []
            }
        }
    }
</script>

<style lang="scss" scoped>
    .cc-tree-card__sub {
        // transition: all 0.3s linear;
        &>.cc-tree-card-item {
            &:first-child {
                .vertical-line {
                    height: 60%;
                }
            }
        }
    }
    .cc-tree-card-item {
        position: relative;
        .vertical-line {
            position: absolute;
            width: 1px;
            height: 120%;
            bottom: 50%;
            background-color: #c0c0c0;
        }
        
        &__section {
            display: flex;
            align-items: center;
            position: relative;
            .horizontal-line {
                width: 10px; 
                height: 1px;
                background-color: #c0c0c0;
            }
        }
        
        &__card {
            flex: 1;
            max-width: 480px;
            display: flex;
            z-index: 1;
            margin: 3px 0;
            padding: 6px 12px;
            background-color: #fff;
            border: 1px solid #e5e5e5;
            border-left: 3px solid #007aff;
            border-radius: 5px;
            // #ifdef H5
            &:hover {
                background-color: #f1f1f1 !important;
            }
            // #endif
        }
        
        &__body {
            display: flex;
            flex: 1; 
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
            .title {
                color: $uni-text-color;
                font-size: $uni-font-size-base;
                overflow: hidden;
            }
            .note {
                color: $uni-text-color-grey;
                font-size: $uni-font-size-sm;
            }
        }
        
        &__foot {
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: right;
            font-size: $uni-font-size-sm;
            color: $uni-text-color-grey;
        }
        
        &__arrow {
            display: flex;
            box-sizing: border-box;
            align-items: center;
            justify-content: center;
            transform: rotate(0deg);
            margin-left: 10px;
            transition: transform 0.3s ease;
            &-active {
            	transform: rotate(-180deg);
            }
        }
    }
</style>
