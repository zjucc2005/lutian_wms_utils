<template>
    <view>
        <textarea
            class="console"
            v-model="input"
            :maxlength="-1"
            focus>
        </textarea>
    </view>
    <button class="mini-btn" type="primary" size="mini" @click="jsEval">提交</button>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import { link_to } from '@/utils'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { Inv, InvPlan, InvLog, BdMaterial, StockLoc, EngBom } from '@/utils/model'
    export default {
        data() {
            return {
                input: ''
            }
        },
        methods: {
            jsEval() {
                console.log(`%c${this.input}`, 'color: #007aff; font-weight: bold')
                eval(this.input)
                this.input = ''
            }
        }
    }
</script>

<style lang="scss" scoped>
    .console {
        width: 100%;
        height: 80vh;
        background-color: #000;
        color: #fff;
        padding: 6px 8px;
    }
</style>
