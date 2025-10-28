<template>
    <view>
        <textarea
            class="console"
            v-model="input"
            :maxlength="-1"
            focus>
        </textarea>
    </view>
    <button type="primary" size="mini" @click="jsEval">Submit</button>
    <button size="mini" @click="input=''">Clear</button>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import { link_to } from '@/utils'
    import K3CloudApi from '@/utils/k3cloudapi'
    import * as model from '@/utils/model'
    export default {
        data() {
            return {
                input: ''
            }
        },
        methods: {
            jsEval() {
                console.log(`%c${this.input}`, 'color: #007aff; font-weight: bold')
                console.log('>>', eval(this.input))
                // eval(this.input)
                // this.input = ''
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
