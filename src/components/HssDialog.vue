<template>
    <el-dialog title="详细信息" :visible.sync="dialogVisible" :before-close="cancelDialog" >
        <el-form class="form">
            <template v-for="(info, key) in dialogInfo">
                <el-form-item :label="'[ '+key+' ] :  '" :key="key">
                    {{info}}
                </el-form-item>
            </template>
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button @click="cancelDialog">关 闭</el-button>
            <el-button type="primary" @click="cancelDialog">确 定</el-button>
        </div>
    </el-dialog>
</template>

<script>
    export default {
        name: "HssDialog",
        components: {},
        props: {
            dialogVisible: {
                type: Boolean,
                default: () => false
            },
            dialogInfo: {
                type: Object,
                default: () => {}
            }
        },
        watch: {
            //监听弹窗显示，可以用来写请求接口
            dialogVisible: function(newVal, oldVal) {
                if (newVal) {
                    console.log("dialogVisible newVal: ", newVal);
                    console.log("dialogVisible oldVal: ", oldVal);
                }
            }
        },
        data() {
            return {
            };
        },
        created() {},
        mounted() {},
        methods: {   //修改父组件传过来的值
            cancelDialog() {
                this.$emit("update:dialogVisible", false);
            }
        }
    };
</script>
<style scoped>
    .form{
        color: #dc6a66;
        background: #eee;
        padding: 0 10px;
    }
    .dialog-footer{
        text-align: center;
    }
</style>