/**
 * Custom ag-grid Config
 * @author Ben Salah Meher <meherbensalah4@gmail.com>
 */
class SBCAgGridTable {
    requestDatas ;
    /**
     * Global variable
     * @type {Array}
     */
     rowData = [];
     columnsList = [];
     columnConfigger = [];
     donnes = [];
     pagination_path ="";
     questionModal;
     uid = "";
     title = "";
     dataGrid = [];
     onDataChange;

     // prepare filter components
     filtersComponents = {
        'text': SBCTextFilter,// custom filter for texts
        'date': SBCDateFilter,// custom filter for dates
        'number': SBCNumberFilter,// ag-grid filter for numbers
        'nullable': SBCIsNullFilter,// ag-grid filter for null values check
     };

    getSortStatus(){
        console.log(this.gridOptions.api.getSortModel());
    }

    openLoader(){
        Loadermodal = UIkit.modal.blockUI(
            `<div class='uk-text-center'>Veuillez patienter quelques instants ...<br/>
                <img class='uk-margin-top' src="${spinnerImg}" alt=''>`
        );
        Loadermodal.show();
    }

    closeLoader(){
        Loadermodal.hide();
        //document.getElementById('myModalLoader').style.display = 'none';
    }

     gridOptions =  {
         columnDefs: [],
         groupSelectsChildren: true,
         rowData: [],
         suppressDragLeaveHidesColumns: true,
         components: {},
         onSortChanged: function () {
             var sortModel = agGridInstance.gridOptions.api.getSortModel();
             if(typeof (sortModel)!== 'undefined'){
                 if(typeof (sortModel.colId) !== 'undefined'){
                     var field = agGridInstance.getSortableField(sortModel.colId)[0].field;
                     agGridInstance.searchNode.sortable.field = field;
                     agGridInstance.searchNode.sortable.sort = sortModel.sort;
                     agGridInstance.paginateData(1);
                 }else{
                     if(typeof (sortModel[0])!== 'undefined'){
                         if(typeof (sortModel[0].colId) !== 'undefined'){
                             var field = agGridInstance.getSortableField(sortModel[0].colId)[0].field;
                             agGridInstance.searchNode.sortable.field = field;
                             agGridInstance.searchNode.sortable.sort = sortModel[0].sort;
                             agGridInstance.paginateData(1);
                         }
                     }
                 }
             }
         },
         onColumnResized: function(params) {
             let field = params.columns[0].colId;
             let width = parseInt(params.columns[0].actualWidth , 10);

             let array = JSON.parse(localStorage.getItem(agGridInstance.uid));
             for(var i=0; i<array.viewedColumns.length; i++){
                 if(array.viewedColumns[i].field === field){
                     array.viewedColumns[i].width = width;
                     break;
                 }
             }
             localStorage.setItem(agGridInstance.uid, JSON.stringify(array));
         },
         defaultColDef: {
             minWidth: 100,
             comparator: (a, b) => {},// keep it empty to prevent ag-grid's default sorting behaviour
             resizable: true,
             filter: false,
             enableRowGroup: true,
             enablePivot: true,
             enableValue: true,
             width: 140,
             suppressSizeToFit: true
         },
         suppressColumnMoveAnimation :false,
         suppressMovableColumns: true,
         animateRows: false,
         sideBar: true,
         rowSelection: 'multiple',
         enableRangeSelection: true,
         skipHeaderOnAutoSize: true
     };

     id="#myGrid";

    // prepare search fetch body
     searchNode = {
        'bundle': '',
        'entity': '',
        'rowsPerPage': 1,
        'pageNumber' : 1,
        'globalSearch' : '',
        'globalSearchFileds': [],
        'alias': '',
        'columns': {'empty': 'true' ,'data':[]},
        'sortable': {'field': '', 'sort': 'asc'}
     };

    /**
     * server side data getter for excel export
     * @param page
     * @param tot
     */
    requestData(page,tot) {
        this.openLoader();
        var path = agGridInstance.pagination_path;
        var body = agGridInstance.searchNode;
        body.rowsPerPage = 4000;
        body.pageNumber = page;
        $.ajax({
            url: path,
            type: 'POST',
            data: body,
            dataType: "json",
            success: function (data) {
                agGridInstance.donnes = agGridInstance.donnes.concat(data.data);
                if(page === tot) {
                    agGridInstance.closeLoader();
                    if (columnsInstance.filterType === 'excel') {
                        excelInstance.export_excel_all(agGridInstance.donnes);
                    } else {
                        if (columnsInstance.filterType === 'print') {
                            printInstance.printAllDatas(agGridInstance.donnes);
                        }
                    }
                }else{
                    agGridInstance.requestData(page+1,tot);
                }
            }
        });
    }

    /**
     * init the array of ag grid table columns defs
     */
     init_columns(render){
        var columnDefinitions = [];
        var configurations = JSON.parse(localStorage.getItem(this.uid));
        for(var j=0; j<configurations.viewedColumns.length; j++){
            for(var i=0; i<this.columnConfigger.length; i++){
                if(this.columnConfigger[i].field === configurations.viewedColumns[j].field ){
                    columnDefinitions.push(this.columnConfigger[i]);
                }
            }
        }
        this.gridOptions.columnDefs = columnDefinitions;

        if(render === true){
            new agGrid.Grid(document.querySelector(this.id),this.gridOptions);
        }
     }

     getColumnConfigByField(field){
         for(var j=0; j<this.columnsList; j++){
             if(this.columnsList[j].field === field){
                 return this.columnsList[j];
             }
         }
     }


    /**
     * init the array of searched objects using the global developper columns configuration named data
     * @param data
     */
     init_searched_columns(data){
        var arrayTMP = [];
        for(var i in data)
        {
            if(data[i].type !== 'html'){
                if(typeof (data[i].queryField) !== 'undefined'){
                    arrayTMP.push({
                        'field': data[i].queryField,
                        'type': data[i].type
                    });
                }else{
                    arrayTMP.push({
                        'field': data[i].field,
                        'type': data[i].type
                    });
                }
            }
        }
        this.searchNode.globalSearchFileds = arrayTMP;
    }

    getFormatter(field, value){
         console.log('--- getFormatter');
         console.log({field,value});
             for(var i=0; i< agGridInstance.columnsList.length; i++){
                 if(agGridInstance.columnsList[i].field === field){
                     if(typeof (agGridInstance.columnsList[i].format) !== 'undefined') {
                         return agGridInstance.columnsList[i].format(value);
                     }else{
                         if(value !== null){
                             return String(value);
                         }else{
                             return "";
                         }
                     }
                 }
             }
             return "";
    }

    /**
     * get the searched config of a specified field in function params
     * @param field
     * @return {Array}
     */
     getSearchedField(field){
        var res = [];
        var configurations = this.columnsList;
        for(var i in configurations)
        {
            if (configurations[i].field === field && configurations[i].searched === true) {
                if (typeof (configurations[i].queryField) !== 'undefined') {
                    res.push({
                        'field': configurations[i].queryField,
                        'type': configurations[i].type,
                        'choices': (configurations[i].choices) ? configurations[i].choices : []
                    });
                } else {
                    res.push({
                        'field': configurations[i].field,
                        'type': configurations[i].type,
                        'choices': (configurations[i].choices) ? configurations[i].choices : []
                    });
                }
            }
        }
        return res;
    }

    getSortableField(field){
        var res = [];
        var configurations = this.columnsList;
        for(var i in configurations)
        {
            if (configurations[i].field === field && configurations[i].sortable === true) {
                if (typeof (configurations[i].queryField) !== 'undefined') {
                    res.push({
                        'field': configurations[i].queryField,
                        'type': configurations[i].type,
                        'choices': (configurations[i].choices) ? configurations[i].choices : []
                    });
                } else {
                    res.push({
                        'field': configurations[i].field,
                        'type': configurations[i].type,
                        'choices': (configurations[i].choices) ? configurations[i].choices : []
                    });
                }
            }
        }
        return res;
    }

    changeRowsNumber(numberPerPage){
        this.searchNode.rowsPerPage = parseInt(numberPerPage,10);
        this.paginateData(1);
    }

    /**
     * init the ag grid row data with the param data
     * @param data
     */
     init_rowData(data){
        /** init data **/
        this.rowData = [];
        var configurations = this.columnsList;
        for(var j=0;j<data.length;j++){
            var value = data[j];
            for(var i in configurations){
                if(configurations[i].type === 'entity' ){
                    var sepField = (''+configurations[i].queryField).split('.');
                    if(value[sepField[0]]!== null){
                        if(typeof (value[sepField[0]]) !== 'undefined'){
                            var obj = value[sepField[0]][sepField[1]];
                        }else{
                            var obj = '';
                        }
                        value[sepField[0]] = obj;
                    }else{
                        value[sepField[0]] = '';
                    }
                }else{
                    if(configurations[i].type === 'date' || configurations[i].type === 'datetime' ){
                        var obj = value[configurations[i].field];
                        if(obj !== null){
                            if(typeof (obj) !== 'undefined'){
                                if(typeof (obj.date) !== 'undefined'){
                                    value[configurations[i].field] = dateFormat(obj.date,configurations[i].dateFormat,true);
                                }else{
                                    value[configurations[i].field] = dateFormat(obj,configurations[i].dateFormat,true);
                                }
                            }else{
                                value[configurations[i].field] = '';
                            }
                        }else{
                            value[configurations[i].field] = '';
                        }
                    }else{
                        if(configurations[i].type === 'html' ){
                            value[configurations[i].field] = configurations[i].cellParameter ;
                        }
                    }
                }
            }
            this.rowData.push(value);
        }
        this.gridOptions.rowData = this.rowData;
     }

    /**
     * function that return all selected rows
     * return array of selected nodes
     */
    getSelectedRows() {
        const selectedNodes = this.gridOptions.api.getSelectedNodes();
        const selectedData = selectedNodes.map( function(node) { return node.data })
        const selectedDataStringPresentation = selectedData.map( function(node) { return node.make + ' ' + node.model }).join(', ')
        alert('Selected nodes: ' + selectedDataStringPresentation);
    }

    getWidthOfColumn(field){
        let array = JSON.parse(localStorage.getItem(this.uid)).viewedColumns;
        for(var i=0; i<array.length; i++){
            if(array[i].field === field){
                return parseInt(array[i].width);
            }
        }
        return 150;
    }

    /**
     * init ag grid table with developper configuration named data
     * @param data
     * @param isRedraw
     */
     config(data, isRedraw){
        $(data.id).empty();
        // pagination init
        this.pagination_path = data.pagination.paginationPath;
        this.searchNode.rowsPerPage = parseInt(data.pagination.rowsPerPage);
        $("#agGrid-rowsPerPage-select").val(data.pagination.rowsPerPage);
        this.searchNode.entity = data.entity;
        this.searchNode.bundle = data.bundle;
        this.searchNode.alias = (''+data.entity).toLowerCase();
        if(data.getRowStyle) this.gridOptions.getRowStyle = data.getRowStyle;
        if(data.onSelectionChanged) this.gridOptions.onSelectionChanged = data.onSelectionChanged;
        this.id= data.id;
        this.uid = data.uid;
        if (isRedraw === true) {
            this.onDataChange = (data.pagination.onDataChange) ? data.pagination.onDataChange : function(){};
            this.columnsList = data.columns;
            printInstance.setTitle(data.title);
            for(var j in data.customGui){
                this.gridOptions.components[data.customGui[j].name] = data.customGui[j].cellrender;
            }
            if(localStorage.getItem(data.uid) !== null){
                this.columnConfigger = [];
                var config_object = {};
                for (var k = 0; k < data.columns.length; k++) {
                    this.columnConfigger.push({
                        headerName: data.columns[k].displayedName,
                        field: data.columns[k].field,
                        width: this.getWidthOfColumn(data.columns[k].field),
                        cellStyle : (data.columns[k].cellStyle) ? data.columns[k].cellStyle : null,
                        filter:  (data.columns[k].filter) ? this.filtersComponents[data.columns[k].filter] : false, //'agDateColumnFilter',
                        filterParams: {
                            extraFilterParams: {
                                entity: data.entity,
                                bundle: data.bundle,
                                fieldType: data.columns[k].type,
                            }
                        },
                        sortable: (data.columns[k].sortable) ? data.columns[k].sortable : false,
                        comparator: (a, b) => {},// keep it empty to prevent ag-grid's default sorting behaviour
                        cellRenderer: (data.columns[k].cellRenderer) ? data.columns[k].cellRenderer : false,
                        valueFormatter: (data.columns[k].valueFormatter) ? data.columns[k].valueFormatter : function(params){
                            return params.value;
                        },
                    });
                }
                var tableConfig = JSON.parse(localStorage.getItem(data.uid));
                var index = 0;
                var field = tableConfig.viewedColumns[index].field;
                var searchND = this.getSearchedField(field);
                while(searchND.length === 0){
                    index ++;
                    field = tableConfig.viewedColumns[index].field;
                    searchND = this.getSearchedField(field);
                }
                this.searchNode.sortable.field = field;
                this.gridOptions.rowData = this.rowData;
                localStorage.setItem('nbData','0');
                this.init_searched_columns(data.columns);
                this.init_columns(true);
                this.paginateData(1);
            }else{
                this.searchNode.sortable.field = data.columns.filter(item => item.searched === true)[0].field;
                this.columnConfigger = [];
                for (var k = 0; k < data.columns.length; k++) {
                    this.columnConfigger.push({
                        headerName: data.columns[k].displayedName,
                        field: data.columns[k].field,
                        width: (data.columns[k].width) ? data.columns[k].width : 150,
                        cellStyle : (data.columns[k].cellStyle) ? data.columns[k].cellStyle : null,
                        filter:  (data.columns[k].filter) ? this.filtersComponents[data.columns[k].filter] : false, //'agDateColumnFilter',
                        filterParams: {
                            extraFilterParams: {
                                entity: data.entity,
                                bundle: data.bundle,
                                fieldType: data.columns[k].type,
                            }
                        },
                        sortable: (data.columns[k].sortable) ? data.columns[k].sortable : false,
                        comparator: (a, b) => {},// keep it empty to prevent ag-grid's default sorting behaviour
                        cellRenderer: (data.columns[k].cellRenderer) ? data.columns[k].cellRenderer : false,
                        valueFormatter: (data.columns[k].valueFormatter) ? data.columns[k].valueFormatter : function(params){
                            return params.value;
                        },
                    });
                }
                var tableConfig = {
                    "uid" : data.uid,
                    "viewedColumns": data.columns.map((item) => { return {field: item.field, displayedName: item.displayedName, width: (item.width)? item.width : 150 } }),
                    "printedColumns": data.columns.filter(it => it.exported === true).map((item) => { return {field: item.field, displayedName: item.displayedName } }),
                    "excelColumns": data.columns.filter(it => it.exported === true).map((item) => { return {field: item.field, displayedName: item.displayedName } }),
                };
                localStorage.setItem(data.uid,JSON.stringify(tableConfig));
                this.init_searched_columns(data.columns);
                //componentsInstance.init_column_config_section(data.columns);
                this.gridOptions.columnDefs = this.columnConfigger;
                this.gridOptions.rowData = this.rowData;
                localStorage.setItem('nbData','0');
                new agGrid.Grid(document.querySelector(data.id),this.gridOptions);
                this.paginateData(1);
            }
            agGridInstance.gridOptions.api.setSortModel([{colId: agGridInstance.searchNode.sortable.field, sort: agGridInstance.searchNode.sortable.sort}]);
        }else{
            new agGrid.Grid(document.querySelector(data.id),this.gridOptions);
        }
        // init_column_filter();
    }

     hasCharacter(val){
        var chars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','y','x','w','z'];
        for (var i = 0; i < val.length; i++) {
            if(chars.includes(val.toLowerCase().charAt(i)) === true ){
                return true;
            }
        }
        return false;
     }

     isDateValue(value){
        console.log('date', {value})
        // You want to check again for !isNaN(parsedDate) here because Dates can be converted
        // to numbers, but a failed Date parse will not.
        if(value.date!== null){
            var parsedDate = Date.parse(value.date);
            if (isNaN(value.date) && !isNaN(parsedDate) && !this.hasCharacter(value.date)) {
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    };

     deleteFilters(){
         $('#searched-in-agGrid').val("");
         this.searchNode.globalSearch = "";
         this.searchNode.columns.empty = true ;
         this.searchNode.columns.data = [];
         this.paginateData(1);
         var columns = JSON.parse(localStorage.getItem(agGridInstance.uid)).viewedColumns;
         agGridInstance.gridOptions.api.setFilterModel(null);
         /*for(var c in columns){
             var filterInstance = agGridInstance.gridOptions.api.getFilterInstance(columns[c].field);
             filterInstance.resetModel();
         }*/
     }

     refreshSearchedFields(){
         if(typeof (localStorage.getItem(agGridInstance.uid)) !== 'undefined'){
             let array = JSON.parse(localStorage.getItem(agGridInstance.uid)).viewedColumns;
             this.searchNode.globalSearchFileds = [];
             try{
                 for(var j=0; j<array.length;j++){
                     var search = this.getSearchedField(array[j].field);
                     if(search.length > 0){
                         this.searchNode.globalSearchFileds.push(search[0]);
                     }
                 }
                 let table = this.columnsList.filter(item => item.searched === true).map(val => {return (val.queryField) ? val.queryField : val.field});
                 this.searchNode.globalSearchFileds = this.searchNode.globalSearchFileds.filter(item => table.includes(item.field));
             }catch (e) {
                 localStorage.removeItem(agGridInstance.uid);
                 window.location.reload(true);
             }
         }
     }

     paginateData(num){
         //agGridInstance.gridOptions.api.setSortModel(null);
         this.refreshSearchedFields();
         this.check_empty_columns_filters();
         //agGridInstance.gridOptions.api.setRowData([]);
         this.gridOptions.api.showLoadingOverlay();
         this.searchNode.pageNumber = num;
         this.searchNode.globalSearch = $('#searched-in-agGrid').val();
         //this.onDataChange();
         $.ajax({
            url: this.pagination_path,
            type: 'POST',
            data: this.searchNode,
            dataType: "json",
            success: function (data) {
                resultSets = JSON.parse(JSON.stringify(data));
                if(parseInt(data.nb,10) === 0){
                    localStorage.setItem('nbData',data.nb);
                    componentsInstance.initPagination(num);
                    agGridInstance.init_rowData([]);
                    agGridInstance.gridOptions.api.setRowData(agGridInstance.rowData);
                    agGridInstance.dataGrid = [];
                    document.getElementById('current-data-number-ag').innerHTML = agGridInstance.rowData.length;
                    document.getElementById('all-data-number-ag').innerHTML = data.nb;
                    agGridInstance.gridOptions.api.hideOverlay();
                    agGridInstance.gridOptions.api.showNoRowsOverlay();
                }else{
                    localStorage.setItem('nbData',data.nb);
                    componentsInstance.initPagination(num);
                    agGridInstance.init_rowData(data.data);
                    agGridInstance.dataGrid = JSON.parse(JSON.stringify(data.data));
                    agGridInstance.gridOptions.api.setRowData(agGridInstance.rowData);
                    document.getElementById('current-data-number-ag').innerHTML = agGridInstance.rowData.length;
                    document.getElementById('all-data-number-ag').innerHTML = data.nb;
                    agGridInstance.gridOptions.api.hideOverlay();
                }
                //agGridInstance.gridOptions.api.setSortModel([{colId: agGridInstance.searchNode.sortable.field, sort: agGridInstance.searchNode.sortable.sort}]);
            }
        });
     }

    check_empty_columns_filters(){
         var array = this.searchNode.columns.data;
         if(array.length>0){
             this.searchNode.columns.empty = 'false';
         }else{
             this.searchNode.columns.empty = 'true';
         }
    }
}