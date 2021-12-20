/**
 * Custom ag-grid Config
 * @author Ben Salah Meher <meherbensalah4@gmail.com>
 */
class SBCPrintAgGrid {

    tableTitle = "";

    setTitle(value){
        this.tableTitle = value;
    }

    getAllData() {
        setTimeout(function () {
            document.getElementById('loading').style.display = 'block';
        }, 200);
        var nb = parseInt(localStorage.getItem('nbData'), 10);
        var repNB = 1;
        if (nb > 4000) {
            repNB = Math.ceil(nb / 4000);
        }
        agGridInstance.donnes = [];
        agGridInstance.requestData(1,repNB);
    }

    printViewedData() {
        let actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).printedColumns;
        let columnsDef = agGridInstance.columnsList;
        let headerPrint = [];
        for(var j= 0; j<actives.length; j++){
            for(var s in columnsDef){
                if(actives[j].field === columnsDef[s].field ){
                    headerPrint.push(columnsDef[s]);
                }
            }
        }
        var res = [];
        agGridInstance.gridOptions.api.forEachNodeAfterFilterAndSort(function (node, index) {
            var val = {};
            for (var c = 0; c < headerPrint.length; c++) {
                if (headerPrint[c].type === 'date' || headerPrint[c].type === 'datetime') {
                    val[headerPrint[c].field] = node.data[headerPrint[c].field];
                } else {
                    if(headerPrint[c].type === 'boolean'){
                        if(headerPrint[c].format){
                            val[headerPrint[c].field] = agGridInstance.getFormatter(headerPrint[c].field,node.data[headerPrint[c].field]);
                        }else{
                            val[headerPrint[c].field] = columnsInstance.booLeanFormatter(node.data[headerPrint[c].field])
                        }
                    }else{
                        if(headerPrint[c].type === 'html'){
                            val[headerPrint[c].field] = agGridInstance.getFormatter(headerPrint[c].field,node.data[headerPrint[c].queryField]);
                        }else{
                            if(headerPrint[c].type === 'entity'){
                                let formatter = (headerPrint[c].valueFormatter) ? headerPrint[c].valueFormatter : function(params){
                                    let field = headerPrint[c].queryField.toString().split('.');
                                    return params.data[field[0]][field[1]];
                                };
                                val[headerPrint[c].field] = formatter( node );
                            }else{
                                val[headerPrint[c].field] = agGridInstance.getFormatter(headerPrint[c].field,node.data[headerPrint[c].field]);
                            }
                        }
                    }
                }
            }
            res.push(val);
        });
        this.proceedToPrinting(res);
    }

    printAllDatas(data) {
        let actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).printedColumns;
        let columnsDef = agGridInstance.columnsList;
        let headerPrint = [];

        for(var j= 0; j<actives.length; j++){
            for(var s in columnsDef){
                if(actives[j].field === columnsDef[s].field ){
                    headerPrint.push(columnsDef[s]);
                }
            }
        }
        var res = [];
        for (var i = 0; i < data.length; i++) {
            var node = data[i];
            var val = {};
            for (var c = 0; c < headerPrint.length; c++) {
                if (headerPrint[c].type === 'date' || headerPrint[c].type === 'datetime') {
                    if(node[headerPrint[c].field] !== null){
                        if(typeof node[headerPrint[c].field].date !== 'undefined'){
                            val[headerPrint[c].field] = dateFormat(node[headerPrint[c].field].date, columnsInstance.getDateFormatByField(headerPrint[c].field), true);
                        }else val[headerPrint[c].field] = "";
                    }else val[headerPrint[c].field] = "";
                } else {
                    if (headerPrint[c].type === 'entity') {
                        var fieldTmp = ('' + headerPrint[c].queryField).split('.');
                        let formatter = (headerPrint[c].valueFormatter) ? headerPrint[c].valueFormatter : function (params) {
                            agGridInstance.getFormatter(headerPrint[c].field,params.data[[fieldTmp[0]]][fieldTmp[1]])
                        };
                        val[headerPrint[c].field] = formatter({data : node});
                    } else {
                        if(headerPrint[c].type === 'boolean'){
                            if(headerPrint[c].format){
                                val[headerPrint[c].field] = agGridInstance.getFormatter(headerPrint[c].field,node[headerPrint[c].field]);
                            }else{
                                val[headerPrint[c].field] = columnsInstance.booLeanFormatter(node[headerPrint[c].field]);
                            }
                        }else{
                            if(headerPrint[c].type === 'html'){
                                val[headerPrint[c].field] = agGridInstance.getFormatter(headerPrint[c].field,node[headerPrint[c].queryField]);
                            }else {
                                val[headerPrint[c].field] = agGridInstance.getFormatter(headerPrint[c].field, node[headerPrint[c].field]);
                            }
                        }
                    }
                }
            }
            res.push(val);
        }
        this.proceedToPrinting(res);
    }

    print_table() {
        agGridInstance.questionModal = UIkit.modal.confirm(`
            <div class="close-modal-ag"><span onclick="agGridInstance.questionModal.hide()">X</span></div>
            <div> <span class="modal-icon-ag" uk-icon="question"> </span> </div>
            <h2 style="text-align: center"> Impression du tableau  </h2> 
            <p style="text-align: center"> Imprimer tous les pages ou seulement la page affiché ? </p>
            <hr class="hr-table-setting">`
            , function (){
                printInstance.getAllData();
                //window.location.reload();
            }, function () {
                printInstance.printViewedData();
                //window.location.reload();
            },
            {
                labels: {
                    'Ok': 'Imprimer tous les pages',
                    'Cancel': 'Imprimer la page actuel'
                }
            }
        );
    }

    /**
     * function that show the columns chooser modal to set the printed columns
     */
    openPrintingModal() {
        columnsInstance.filterType = 'print';
        $('#initial-columns').empty();
        $('#results-columns').empty();
        $('#myModal').remove();
        var modal = componentsInstance.columnConfigModalPrint.clone();
        $('body').append(modal);
        modal.find('input').val(printInstance.tableTitle);
        $('#myModal').attr('datasrc', 'modal');
        $('#myModal').css({'display': "block"});
        componentsInstance.init_column_config_section(agGridInstance.columnsList);
    }

    proceedToPrinting(data) {
        let actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).printedColumns;
        let columnsDef = agGridInstance.columnsList;
        let headerArray = [];
        for(var j= 0; j<actives.length; j++){
            for(var s in columnsDef){
                if(actives[j].field === columnsDef[s].field ){
                    headerArray.push(columnsDef[s]);
                }
            }
        }
        const printContent = document.getElementById("print-zone");
        const WindowPrt = window.open('', '', 'left=0,top=0,width=1050,height=900,toolbar=0,scrollbars=0,status=0');

        WindowPrt.document.write(`
          <html>
            <head>
              <title>${printInstance.tableTitle}</title>
              <style>
                /* @media print { */
                  body { font-family: sans-serif; }
                  @page { size: landscape; }
                  table{
                    border-collapse: collapse;
                    width: 100%
                  }
                  table thead{
                    background-color: #cccccc !important;
                    -webkit-print-color-adjust: exact;
                  }
                  table th, td{
                    border: solid 1px black;
                    padding: 5px;
                  }
                  table th{
                    text-align: center;
                  }
                  .title-to-print{
                    font-size: 20px;
                    font-weight: bold;
                  }
                  h4, h6{
                    text-align: center;
                  }
                /* } */
              </style>
            </head>
            <body>
        `);
        if(printInstance.tableTitle !== ''){
            WindowPrt.document.write(`<h2> ${ printInstance.tableTitle } </h2>`);
        }
        WindowPrt.document.write(`<table>`);
        //header table :
        WindowPrt.document.write(`<thead>`);
        for (var i = 0; i < headerArray.length; i++) {
            WindowPrt.document.write(`<th>${headerArray[i].displayedName}</th>`);
        }
        WindowPrt.document.write(`</thead>`);

        // table body data :
        WindowPrt.document.write(`<tbody>`);
        // ici faire une boucle pour créer le tableau
        for (var j = 0; j < data.length; j++) {
            WindowPrt.document.write(`<tr>`);
            for (var k = 0; k < headerArray.length; k++) {
                WindowPrt.document.write(`<td>${data[j][headerArray[k].field]}</td>`);
            }
            WindowPrt.document.write(`</tr>`);
        }
        WindowPrt.document.write(`</tbody>`);

        WindowPrt.document.write('</table></body></html>');
        WindowPrt.document.close();
        WindowPrt.focus();

        WindowPrt.print();
        setTimeout(() => {
            WindowPrt.close();
        }, 200);
    }
}