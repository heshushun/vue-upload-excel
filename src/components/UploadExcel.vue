
<template>
    <div>
        <!-- 文件上传区域 -->
        <input
                ref="excel-upload-input"
                class="excel-upload-input"
                type="file"
                accept=".xlsx, .xls"
                @change="handleClick"
        />
        <div class="drop" v-if="showDrop" @drop="handleDrop" @dragover="handleDragover" @dragenter="handleDragover">
            拖动Excel文件到此处或者
            <el-button
                    :loading="loading"
                    style="margin-left:16px;"
                    size="mini"
                    type="primary"
                    @click="handleUpload"
            >选择文件</el-button>
        </div>

        <div class="dropShow" >
            <el-button type="text" class="dropShowBtn" @click="closeDrop">
                {{word}} <i :class="showDrop ? 'el-icon-arrow-up': 'el-icon-arrow-down'"></i>
            </el-button>
        </div>

        <!-- 数据显示区域 -->
        <div v-if="showData">
            <el-tabs v-model="chooseTable" @tab-click="tabClick">
                <el-tab-pane
                        v-for="(sheet,index) of excelData.sheetList"
                        :label="sheet"
                        :name="index.toString()"
                        :key="sheet"
                ></el-tab-pane>
            </el-tabs>
            <!--<el-button v-show="JSON.stringify(tableData) !== '[]'" size="mini" type="primary" @click="pushData">输出该表数据</el-button>-->
            <el-button v-show="hasTableData()" size="mini" type="primary" @click="clearFilter">重置所有筛选</el-button>
            <el-table :data="tables" ref="filterTable" stripe border :height="tableHeight" highlight-current-row style="width: 100%;margin-top:20px;">
                <template v-for="(item, index) in tableHeader">
                    <el-table-column v-if="index === 0" :prop="item" :label="item" :key="item" :filters="filterData(item)" :filter-method="filterHandler" sortable fixed/>
                    <el-table-column v-if="index > 0" :prop="item" :label="item" :key="item" :filters="filterData(item)" :filter-method="filterHandler" sortable/>
                </template>
                <el-table-column v-if="hasTableData()" align="right">
                    <template slot="header" slot-scope="{}">
                        <el-input v-model="search" size="mini" placeholder="输入关键字搜索"/>
                    </template>
                    <template slot-scope="scope">
                        <el-button size="mini" type="primary" @click="handleEdit(scope.$index, scope.row)" icon="el-icon-edit"></el-button>
                        <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)" icon="el-icon-delete"></el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

    </div>
</template>

<script>
    import XLSX from "xlsx";
    export default {
        props: {
            beforeUpload: Function,
            onSuccess: Function,
            showData: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                loading: false,
                excelData: {
                    headerList: null,
                    resultsList: null,
                    sheetList: []
                },

                // 选择页签
                chooseTable: 0,
                // 当前页签 数据
                tableData: [],
                // 当前页签 表头数据
                tableHeader: [],

                filterData: Function,

                search: '',

                showDrop: true,

                tableHeight: 0
            };
        },
        mounted () {
            this.$nextTick(function() {
                this.setTableHeight(320);
            });
        },
        methods: {

            //选择文件点击上传
            handleClick(e) {
                const files = e.target.files;
                const rawFile = files[0];
                if (!rawFile) return;
                this.upload(rawFile);
            },

            //拖动文件上传
            handleDrop(e) {
                e.stopPropagation();
                e.preventDefault();
                if (this.loading) return;
                const files = e.dataTransfer.files;
                if (files.length !== 1) {
                    this.$message.error("Only support uploading one file!");
                    return;
                }
                const rawFile = files[0];
                if (!this.isExcel(rawFile)) {
                    this.$message.error(
                        "Only supports upload .xlsx, .xls, .csv suffix files"
                    );
                    return false;
                }
                this.upload(rawFile);
                e.stopPropagation();
                e.preventDefault();
            },

            // 处理拖动
            handleDragover(e) {
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
            },

            // 处理上传
            handleUpload() {
                this.$refs["excel-upload-input"].click();
            },

            //上传文件
            upload(rawFile) {
                this.$refs["excel-upload-input"].value = null;
                if (!this.beforeUpload) {
                    this.readerData(rawFile);
                    return;
                }
                const before = this.beforeUpload(rawFile);
                if (before) {
                    this.readerData(rawFile);
                }
            },

            //读取上传文件数据
            readerData(rawFile) {
                this.loading = true;
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        const data = e.target.result;
                        const fixedData = this.fixData(data);
                        const workbook = XLSX.read(btoa(fixedData), { type: "base64" });
                        //1.先获取excel中工具表的列表
                        const sheetList = workbook.SheetNames;
                        let headerList = [];
                        let resultsList = [];
                        let newWorkSheet = "";
                        //2.传回所有工作表的表头和数据
                        for (let i = 0; i < sheetList.length; i++) {
                            newWorkSheet = workbook.Sheets[sheetList[i]];
                            // newWorkSheet = this.formatSheet(workbook.Sheets[SheetList[i]]);
                            headerList.push(this.getHeaderRow(newWorkSheet));
                            resultsList.push(XLSX.utils.sheet_to_json(newWorkSheet));
                        }
                        this.generateData({ headerList, resultsList, sheetList });
                        this.loading = false;
                        resolve();
                        if (!reader) {
                            reject();
                        }
                    };
                    reader.readAsArrayBuffer(rawFile);
                });
            },

            //生成表格数据
            generateData({ headerList, resultsList, sheetList }) {
                this.excelData.headerList = headerList;
                this.excelData.resultsList = resultsList;
                this.excelData.sheetList = sheetList;
                this.onSuccess && this.onSuccess(this.excelData);
                this.tableData = this.excelData.resultsList[this.chooseTable];
                this.tableHeader = this.excelData.headerList[this.chooseTable];
                this.filterData = this.genFilterData;
            },

            // 固定数据
            fixData(data) {
                let o = "";
                let l = 0;
                const w = 10240;
                for (; l < data.byteLength / w; ++l)
                    o += String.fromCharCode.apply(
                        null,
                        new Uint8Array(data.slice(l * w, l * w + w))
                    );
                o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
                return o;
            },

            // 获取表头列
            getHeaderRow(sheet) {
                const headers = [];
                const range = XLSX.utils.decode_range(sheet["!ref"]);
                let C;
                const R = range.s.r;
                /* start in the first row */
                for (C = range.s.c; C <= range.e.c; ++C) {
                    /* walk every column in the range */
                    const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
                    /* find the cell in the first row */
                    let hdr = "UNKNOWN " + C; // <-- replace with your desired default
                    if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
                    headers.push(hdr);
                }
                return headers;
            },

            // 是否 表格
            isExcel(file) {
                return /\.(xlsx|xls|csv)$/.test(file.name);
            },

            // 页签切换
            tabClick(tab) {
                this.chooseTable = tab.name;
                this.tableData = this.excelData.resultsList[this.chooseTable];
                this.tableHeader = this.excelData.headerList[this.chooseTable];
                this.filterData = this.genFilterData;
            },

            // 输出数据
            pushData(){
                this.$emit('tableData',this.excelData.resultsList[this.chooseTable])
            },

            // 设置table高度
            setTableHeight (v) {
                this.tableHeight = window.innerHeight - v;
            },

            // 清除所有过滤器
            clearFilter() {
                this.$refs.filterTable.clearFilter();
            },

            // 过滤器
            filterHandler(value, row, column) {
                const property = column['property'];
                return row[property] === value;
            },

            // 去重
            unique(arrs) {
                const res = new Map();
                return arrs.filter((arr) => !res.has(arr) && res.set(arr, 1))
            },

            // 生成筛选
            genFilterData(field) {
                const uniqueTableData = this.unique(this.tableData);
                const newFilterData = [];
                uniqueTableData.forEach(item =>{
                    newFilterData.push({text: item[field], value: item[field]})
                });
                return newFilterData
            },

            // 处理修改
            handleEdit(index, row) {
                console.log(index, row);
            },

            // 处理删除
            handleDelete(index, row) {
                console.log(index, row);
            },

            // 是否有表数据
            hasTableData() {
                return JSON.stringify(this.tableData) !== '[]'
            },

            // 收缩导入窗
            closeDrop() {
                this.showDrop = !this.showDrop;
                console.info(this.showDrop);
                if (!this.showDrop) {
                    this.setTableHeight(180);
                }else {
                    this.setTableHeight(320);
                }
            }

        },
        computed: {
            // 模糊搜索
            tables() {
                const search = this.search;
                if (search) {
                    return this.tableData.filter(data => {
                        return Object.keys(data).some(key => {
                            return String(data[key]).toLowerCase().includes(search.toLowerCase())
                        })
                    })
                }
                return this.tableData
            },
            word() {
                if (this.showDrop === false) {
                    return "展开导入";
                } else {
                    return "收起导入";
                }
            },
        }
    };
</script>

<style scoped>
    .excel-upload-input {
        display: none;
        z-index: -9999;
    }
    .drop {
        border: 2px dashed #bbb;
        width: 600px;
        height: 160px;
        line-height: 160px;
        margin: 0 auto;
        font-size: 24px;
        border-radius: 5px;
        text-align: center;
        color: #bbb;
        position: relative;
    }
    .dropShow {
        width: 600px;
        height: 20px;
        margin: 0 auto;
        text-align: center;
        color: #bbb;
    }
    .dropShowBtn {
        width: 300px;
        height: 15px;
        margin: 0 auto;
        text-align: center;
    }

</style>
