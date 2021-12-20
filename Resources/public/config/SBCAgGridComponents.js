/**
 * Custom ag-grid Config
 * @author Ben Salah Meher <meherbensalah4@gmail.com>
 */
class SBCAgGridComponent {

    columnConfigModalPrint =
        $(`<div id="myModal" class="modal" datasrc="modal">
          <!-- Modal content -->
          <div class="modal-content" datasrc="modal">
             <span class="close" datasrc="modal" onclick="columnsInstance.closeModalColumns()">&times;</span>
             <h2 datasrc="modal" style="text-align: center">Configurer les colonnes à imprimer</h2>
             <div datasrc="modal" style="margin-left: 4%;width: 100%; display: inline-block;">
                <h3 datasrc="modal" id="printTitleInput" style="display: inline;"> titre </h3>
                <input datasrc="modal" class="" id="title-table-input" oninput="printInstance.setTitle(this.value)" 
                   style="display: inline-block;width: 82%;margin-left: 4%;height: 23px;" value="${printInstance.tableTitle}"> 
             </div>
             <table datasrc="modal" style="width: 94%;margin-left: 3%;border:none;">
                <tr datasrc="modal" style="width: 100%">
                   <td datasrc="modal" class="setting-column-td">
                      <div datasrc="modal" id="initial-columns" class="columns-list" style="height: 200px;"></div>
                   </td>
                   <td datasrc="modal" style="width:10%;height:200px;border: none;">
                      <div datasrc="modal" class="transfert-btn">
                         <button onclick="componentsInstance.addAllColumns()" datasrc="modal" class="transfert-btn-item">>></button>
                         <button onclick="componentsInstance.removeAllColumns()" datasrc="modal" style="margin-top: 10%" class="transfert-btn-item"><<</button>
                      </div>
                   </td>
                   <td datasrc="modal" class="setting-column-td">
                     <div datasrc="modal" id="results-columns" class="columns-list" style="height: 200px;"></div>
                   </td>
                </tr>
             </table>
             <hr datasrc="modal" class="hr-table-setting">
             <div datasrc="modal" class="buttons-setting" >
               <button datasrc="modal" id="submit-column-setting" onclick="columnsInstance.confirmColumnConfig()" class="setting-columns-btn"> Valider </button>
               <button datasrc="modal" id="cancel-column-setting" class="setting-columns-btn" onclick="columnsInstance.closeModalColumns()"> Quitter </button>
             </div>
          </div>
    </div>`);
    columnConfigModal =
        $(`<div id="myModal" class="modal" datasrc="modal">
          <!-- Modal content -->
          <div class="modal-content" datasrc="modal">
             <span class="close" datasrc="modal" onclick="columnsInstance.closeModalColumns()">&times;</span>
             <h2 datasrc="modal" style="text-align: center">Configurer les colonnes à afficher</h2>
             <table datasrc="modal" style="width: 94%;margin-left: 3%;border:none;">
                <tr datasrc="modal" style="width: 100%">
                   <td datasrc="modal" class="setting-column-td">
                      <div datasrc="modal" id="initial-columns" class="columns-list"></div>
                   </td>
                   <td datasrc="modal" style="width:10%;height:250px;border: none;">
                      <div datasrc="modal" class="transfert-btn">
                         <button onclick="componentsInstance.addAllColumns()" datasrc="modal" class="transfert-btn-item">>></button>
                         <button onclick="componentsInstance.removeAllColumns()" datasrc="modal" style="margin-top: 10%" class="transfert-btn-item"><<</button>
                      </div>
                   </td>
                   <td datasrc="modal" class="setting-column-td">
                     <div datasrc="modal" id="results-columns" class="columns-list"></div>
                   </td>
                </tr>
             </table>
             <hr datasrc="modal" class="hr-table-setting">
             <div datasrc="modal" class="buttons-setting" >
               <button datasrc="modal" id="submit-column-setting" onclick="columnsInstance.confirmColumnConfig()" class="setting-columns-btn"> Valider </button>
               <button datasrc="modal" id="cancel-column-setting" class="setting-columns-btn" onclick="columnsInstance.closeModalColumns()"> Quitter </button>
             </div>
          </div>
    </div>`);

    /**
     * pagination predToFirst btn html component
     * @type {jQuery.fn.init|jQuery|HTMLElement}
     */
    goToFirstPage = $(`<li class="page-item pagination-left"><a class="page-link"
            onclick="componentsInstance.fetchFirstPage()"><<</a></li>`);

    /**
     * pagination nextToLast btn html component
     * @type {jQuery.fn.init|jQuery|HTMLElement}
     */
    goToLastPage = $(`<li class="page-item pagination-right"><a class="page-link" 
            onclick="componentsInstance.fetchLastPage()">>></a></li>`);

    /**
     * Pagination area component
     * @type {jQuery.fn.init|jQuery|HTMLElement}
     */
    pagination = $(`<div id="pagination-Grid">
                        <div style="height: 55px;width: 99.88%;border: solid 1px;border-color: #babfc7;
                             border-color: var(--ag-border-color, #babfc7);border-radius: 3px">
                                <ul class="pagination-agGrid" ></ul></div></div>`);

    /**
     * COLUMNS CONFIG FUNCTIONS
     */

    /**
     * function : append column to the viewed columns list
     * @param dom
     */
    choose_column(dom) {
        let dataControl = $(dom).attr('data-controls');
        if (typeof ($('.col-item-res-' + dataControl)[0]) === 'undefined') {
            let newDOM = $(`<div datasrc="modal" id="initial-columns" class="column-item" tabindex="0" 
                                data-controls="${parseInt($(dom).attr("data-controls"), 10)}">${$(dom).html()}</div>`);
            newDOM.addClass('col-item-res-' + dataControl)
                .click(function () {
                    componentsInstance.remove_column($(this));
                });
            $('#results-columns').append(newDOM);
        }
    }

    removeAllColumns() {
        $('#results-columns > .column-item').each(function () {
            $(this).click();
        });
    }

    addAllColumns() {
        $('#initial-columns > .column-item').each(function () {
            $(this).click();
        });
    }

    init_initial_columns_list(data){
        for (let k = 0; k < data.length; k++) {
            let li = $(`<div datasrc="modal" id="initial-columns" class="column-item" tabindex="0" 
                    data-controls="${k}">${data[k].displayedName}</div>`);
                $('#initial-columns').append(
                    li.addClass('col-item-init-' + k)
                        .click(function () {
                            componentsInstance.choose_column($(this));
                        })
                );
        }
    }

    getColumnByField(table, field) {
        let array = agGridInstance.columnsList;
        for(let j=0; j<array.length; j++){
            if(array[j].field === field){
                return {
                    'displayedName': array[j].displayedName,
                    'index': j
                }
            }
        }
    }

    /**
     * init configuration list of viewed column
     * @param data
     */
    init_column_config_section(data) {
        data = agGridInstance.columnsList;
        let actives = [];
        if (columnsInstance.filterType === 'view') {
            actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).viewedColumns;
        } else {
            if (columnsInstance.filterType === 'print'){
                actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).printedColumns;
            }else{
                actives = JSON.parse(localStorage.getItem(agGridInstance.uid)).excelColumns;
            }
        }

        if(columnsInstance.filterType === 'view'){
            this.init_initial_columns_list(data);
            for (let k = 0; k < actives.length; k++) {
                let columnData = this.getColumnByField(agGridInstance.columnsList, actives[k].field);
                console.log('columnData *** config cols ----');
                console.log(columnData);
                let li = $(`<div datasrc="modal" id="initial-columns" class="column-item" tabindex="0" 
                    data-controls="${columnData.index}">${columnData.displayedName}</div>`);
                $('#results-columns').append(
                    li.addClass('col-item-res-' + columnData.index)
                        .click(function () {
                            componentsInstance.remove_column($(this));
                        })
                );
            }
        }else{
            let datas  = [];
            for (let i=0;i<data.length; i++){
                if( data[i].exported === true ) {
                    datas.push(data[i]) ;
                }
            }
            console.log(datas);
            this.init_initial_columns_list(datas);
            for (let k = 0; k < actives.length; k++) {
                for(let j=0; j<datas.length; j++){
                    if(datas[j].field === actives[k].field && datas[j].exported === true){
                        let li = $(`<div datasrc="modal" id="initial-columns" class="column-item" tabindex="0" 
                            data-controls="${j}">${datas[j].displayedName}</div>`);
                        $('#results-columns').append(
                            li.addClass('col-item-res-' + k)
                                .click(function () {
                                    componentsInstance.remove_column($(this));
                                })
                        );
                    }
                }
            }
        }
        $('#results-columns').sortable();
        $('#results-columns').disableSelection();
    }

    /**
     * remove a column from the viewed columns list
     * @param dom
     */
    remove_column(dom) {
        $(dom).remove();
    }

    /**
     * PAGINATION CREATION FUNCTIONS
     */

    /**
     * create a page number component using JQUERY
     * @param num
     * @return {*|jQuery}
     */
    appendNewPagePagination(num) {
        return $(`<li class="page-away-${num} page-agGrid" data-active-page="${num}"><a>${num}</a></li>`)
            .click(function () {
                agGridInstance.paginateData(parseInt($(this).attr("data-active-page"), 10));
            });
    }


    /**
     * create all pagination pages switch the current page number
     * @param num
     * @return {*}
     */
    createPagination(num) {
        let paginationNode = this.pagination.clone();
        paginationNode.find('ul').empty();
        paginationNode.find('ul').append(this.goToFirstPage);
        let nbRows = parseInt(localStorage.getItem('nbData'), 10);
        let nbPages = 1;
        if(nbRows > parseInt(agGridInstance.searchNode.rowsPerPage,10)){
            nbPages = Math.ceil(nbRows / agGridInstance.searchNode.rowsPerPage);
        }
        if (nbPages > 4) {
            if (nbPages >= (parseInt(num, 10) + 2)) {
                if (parseInt(num, 10) > 2) {
                    let b = parseInt(num, 10);
                    if ((b + 1) * agGridInstance.searchNode.rowsPerPage < nbRows) {
                        for (let n = (b - 2); n <= (b + 2); n++) {
                            paginationNode.find('ul').append(this.appendNewPagePagination(n));
                        }
                    } else {
                        for (let n = (b - 2); n <= (b + 1); n++) {
                            paginationNode.find('ul').append(this.appendNewPagePagination(n));
                        }
                    }
                } else {
                    if (parseInt(num, 10) > 1) {
                        if ((parseInt(num, 10) + 2) * agGridInstance.searchNode.rowsPerPage < nbRows) {
                            for (let n = (parseInt(num, 10) - 1); n <= (parseInt(num, 10) + 3); n++) {
                                paginationNode.find('ul').append(this.appendNewPagePagination(n));
                            }
                        } else {
                            for (let n = (parseInt(num, 10) - 1); n <= (parseInt(num, 10) + 2); n++) {
                                paginationNode.find('ul').append(this.appendNewPagePagination(n));
                            }
                        }
                    } else {
                        if ((parseInt(num, 10) + 3) * agGridInstance.searchNode.rowsPerPage < nbRows) {
                            for (let n = (parseInt(num, 10)); n <= (parseInt(num, 10) + 4); n++) {
                                paginationNode.find('ul').append(this.appendNewPagePagination(n));
                            }
                        } else {
                            for (let n = (parseInt(num, 10)); n <= (parseInt(num, 10) + 3); n++) {
                                paginationNode.find('ul').append(this.appendNewPagePagination(n));
                            }
                        }
                    }
                }
            } else {
                if (parseInt(num, 10) > 2) {
                    for (let n = (parseInt(num, 10) - 2); n <= nbPages; n++) {
                        paginationNode.find('ul').append(this.appendNewPagePagination(n));
                    }
                } else {
                    if (parseInt(num, 10) > 1) {
                        for (let n = (parseInt(num, 10) - 1); n < nbPages; n++) {
                            paginationNode.find('ul').append(this.appendNewPagePagination(n));
                        }
                    } else {
                        for (let n = (parseInt(num, 10)); n < nbPages; n++) {
                            paginationNode.find('ul').append(this.appendNewPagePagination(n));
                        }
                    }
                }
            }
        } else {
            for (let n = 1; n < nbPages+1; n++) {
                paginationNode.find('ul').append(this.appendNewPagePagination(n));
            }
        }
        paginationNode.find('ul').append(this.goToLastPage);
        return paginationNode;
    }

    fetchFirstPage(){
        agGridInstance.paginateData(1);
    }

    fetchLastPage(){
        let nbRows = parseInt(localStorage.getItem('nbData'), 10);
        let nbPages = 1;
        if(nbRows > parseInt(agGridInstance.searchNode.rowsPerPage,10)){
            nbPages = Math.ceil(nbRows / agGridInstance.searchNode.rowsPerPage);
        }
        agGridInstance.paginateData(nbPages);
    }

    /**
     * function to set the position of the pagination
     */
    initPaginationPosition() {
        let contentwidth = parseFloat($('.pagination-agGrid').css('width'));
        let withParent = parseFloat($('#pagination-Grid').find('div').css('width'));
        let marginRes = withParent - contentwidth;
        $('ul.pagination-agGrid').css({'margin-left': (marginRes - 100) + 'px'})
    }

    /**
     * init pagination initial function
     * @param num
     */
    initPagination(num) {
        if (typeof ($('#pagination-Grid')) !== 'undefined') {
            $('#pagination-Grid').remove();
        }
        if (parseInt(localStorage.getItem('nbData'), 10) > 0) {
            $('#data-containe-ag').append(this.createPagination(num));
            $('.page-away-' + num).addClass('active');
            this.initPaginationPosition();
        }
    }
}