class SBCIsNullFilter {

    elements = [];
    filtered = [];
    selected = [];
    data = [];
    hideFilter;
    filterIsActive = false;

    setModel(model){
        if (model === null){
            this.filterIsActive = false;
            //this.setupGui(this.params);
            this.elementChecked(true,'All');
            this.gui.querySelector('#select-all-checkbox').checked = true;
        }
    }

    init(params) {
        this.valueGetter = params.valueGetter;
        this.setupGui(params);
        this.appendStylesToBody();
    }

    afterGuiAttached(params){
        this.hideFilter = params.hidePopup;
    }

    /**
     * Create <style/> tag and append it to the body
     */
    appendStylesToBody() {
        let elem = document.createElement('style');
        elem.innerHTML = this.style();
        document.head.appendChild(elem);
    }

    setupGui(params){
        this.params = params;
        let idFilterInput = `${params.colDef.field}-filter-input`;

        this.gui = document.createElement('div');
        this.gui.classList.add('sbc-text-filter-container');
        this.gui.innerHTML = `
            <div>
                <input id="${idFilterInput}" type="text" placeholder="Recherche...">
            </div>
            <div class="all-checkbox-container">
                <label>
                    <input id="select-all-checkbox" type="checkbox"> 
                    Tout sélectionner
                </label>
            </div>
            <div class="elements">
                <!--========== filtered elements goes here =========-->
            </div>
            <div>
                <button id="clear-btn">Vider</button>
                <button id="filter-btn">Filtrer</button>
            </div>
        `;

        // run first search with empty string
        this.loadDistinctFromDB();

        // handle search field changes
        this.gui.querySelector(`#${idFilterInput}`)
            .addEventListener("keyup", ($event) => {
                this.filterInElements($event.target.value);
            });

        // handle "select all checkbox" changes
        this.gui.querySelector('#select-all-checkbox')
            .addEventListener('click', (elem) => {
                this.elementChecked(elem.target.checked, 'All');
            });

        // handle clear button event
        this.gui.querySelector('#clear-btn')
            .addEventListener('click', () => {
                this.filterIsActive = false;
                this.elementChecked(true, 'All');
                this.gui.querySelector(`#${idFilterInput}`).value = "";
                this.filterInElements("");
                let field = this.params.colDef.field;
                let fieldNode = agGridInstance.getSearchedField(field)[0];
                let queryField = fieldNode.field;
                this.removeFilter(queryField);
                agGridInstance.paginateData(1);
            });

        // handle filter button event
        this.gui.querySelector('#filter-btn')
            .addEventListener('click', () => {
                this.filterIsActive = true;
                // lancement des recherche de filter column
                this.invokeFilter();
            });
    }

    /**
     * Run server side filtering based on the selected data
     */
    invokeFilter(){
        let field = this.params.colDef.field;
        let fieldNode = agGridInstance.getSearchedField(field)[0];
        let queryField = fieldNode.field;
        let array = [];

        if(this.selected.length===1){
            for(let j=0; j<this.data.length; j++){
                if(this.selected.includes(String(this.data[j].formatted))){
                    array.push(String(this.data[j].value));
                }
            }
            if(this.filterExist(queryField) === false){
                agGridInstance.searchNode.columns.data.push({
                    field : queryField,
                    type: 'nullable',
                    data: array
                });
            }else{
                this.removeFilter(queryField);
                agGridInstance.searchNode.columns.data.push({
                    field : queryField,
                    type: 'nullable',
                    data: array
                });
            }
            this.hideFilter();
            if(array.length>0){
                agGridInstance.paginateData(1);
            }else{
                UIkit.modal.alert('(NB) : Vous devez selectionner au moin un valeur!');
            }
        }else{
            this.removeFilter(queryField);
            this.hideFilter();
            agGridInstance.paginateData(1);
        }
    }

    resetModel(){
        this.elementChecked(true, 'All');
    }

    isFilterActive(){
        return this.filterIsActive;
    }

    // The grid will ask each active filter, in turn, whether each row in the grid passes. If any
    // filter fails, then the row will be excluded from the final set. A params object is supplied
    // containing attributes of node (the rowNode the grid creates that wraps the data) and data (the data
    // object that you provided to the grid for that row).
    doesFilterPass(params){
        return true;
    }

    // Gets called when new rows are inserted into the grid. If the filter needs to change its
    // state after rows are loaded, it can do it here. For example the set filters uses this
    // to update the list of available values to select from (e.g. 'Ireland', 'UK' etc for
    // Country filter).
    onNewRowsLoaded(){
        console.log('new rows loaded');
    }

    filterExist(field){
        for(var j in agGridInstance.searchNode.columns.data){
            if(agGridInstance.searchNode.columns.data[j].field === field ){
                return true;
            }
        }
        return false;
    }

    removeFilter(field){
        for(var j in agGridInstance.searchNode.columns.data){
            if(agGridInstance.searchNode.columns.data[j].field === field ){
                agGridInstance.searchNode.columns.data.splice(j,1);
            }
        }
    }

    getGui() {
        return this.gui;
    }

    loadDistinctFromDB() {
        let fieldName = this.params.colDef.field;
        let fieldNode = agGridInstance.getSearchedField(fieldName)[0];

        let field = fieldNode.field;
        this.elements = [null,1].map((o) => agGridInstance.getFormatter(fieldName,o));
        this.data = [
            {'formatted': this.elements[0], 'value': 0},
            {'formatted': this.elements[1], 'value': 1}
        ];
        this.filtered = [...this.elements];
        this.selected = [...this.filtered];

        this.buildElementsList();
        this.handleSelectAllCheckbox();
    }

    /**
     * Filter in the list of available elements
     * Invoked after loadDistinctFromDB() when user type in the search field
     *
     * @param value (user input)
     */
    filterInElements(value){
        this.filtered = this.elements.filter(x => x.toLowerCase().indexOf(value.toLowerCase()) !== -1);
        this.selected = [...this.filtered];
        this.buildElementsList();
        this.handleSelectAllCheckbox();
    }

    /**
     * Build tree view of the filter
     */
    buildElementsList(){
        let view = '';
        this.filtered.forEach((element) => {
            view += `
                <div>
                    <label>
                        <input 
                            type="checkbox" 
                            class="element-checkbox"
                            value="${element}" 
                            ${(this.selected.includes(element)) ? 'checked' : null}> 
                        ${element}
                    </label>
                </div>
            `;
        });

        // update the view
        this.gui.querySelector('.elements').innerHTML = view;

        // make sure to add listener to newly created DOMs
        this.gui.querySelectorAll('.element-checkbox').forEach((elem) => {
            elem.addEventListener('click', (e) => {
                this.elementChecked(e.target.checked, e.target.value);
            })
        });
    }

    /**
     * Handle checkbox click event
     * @param checked (status: checked or not)
     * @param value (value if the checkbox)
     */
    /**
     * Handle checkbox click event
     * @param checked (status: checked or not)
     * @param value (value if the checkbox)
     */
    elementChecked(checked, value){
        if(value === 'All'){
            this.gui.querySelector('#select-all-checkbox').checked = true;
            this.selected = (checked) ? [...this.filtered] : [];
            // update checkboxes with the new value
            this.gui.querySelectorAll('.element-checkbox').forEach((elem) => {
                elem.checked = checked;
            });
        }else{
            if(checked) this.selected.push(value);
            else this.selected.splice(this.selected.indexOf(value), 1);
            this.handleSelectAllCheckbox();
        }
    }

    /**
     * Handle the "select all checkbox" (selected or not) based on the selected and filtered elements
     */
    handleSelectAllCheckbox(){
        this.gui.querySelector('#select-all-checkbox').checked = (this.selected.length === this.filtered.length);
    }

    /**
     * CSS style of the component
     * @return {string}
     */
    style = () => {
        return `
        .sbc-text-filter-container{
            width: 200px;
            padding: 5px;
        }
        
        .sbc-text-filter-container input{
            width: 96%;
        }
        
        .sbc-text-filter-container .all-checkbox-container{
            margin-top: 5px;
        }
        
        .sbc-text-filter-container .elements{
            border: solid 1px #ababab;
            margin-top: 5px;
            margin-bottom: 5px;
            height: 150px;
            overflow: auto;
        }
        
        .sbc-text-filter-container input[type=checkbox]{
            opacity: 1;
            position: unset;
            width: auto;
            vertical-align: middle;
        }
        
        .sbc-text-filter-container label{
            color: #8d8d8d;
            font-size: 11px;
            white-space: nowrap;
        }
        
        .sbc-text-filter-container button{
            margin-right: 5px;
        }
    `;
    }
}