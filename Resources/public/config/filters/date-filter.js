/**
 * Custom date filter for ag-grid
 * @author Slimen Arnaout <arnaout.slimen@gmail.com>
 */
class SBCDateFilter {

    elements = [];
    filtered = [];
    selected = [];
    MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
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

    setupGui(params) {
        this.params = params;
        let idFilterInput = `${params.colDef.field}-filter-input`;
        this.gui = document.createElement('div');
        this.gui.classList.add('sbc-date-filter-container');
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
                <ul class="date-tree">
                  <li><span class="caret cart-down"><input type="checkbox"> 2020</span>
                    <ul class="nested active">
                      <li><span class="caret cart-down"><input type="checkbox"> Mars</span>
                        <ul class="nested active">
                          <li><input type="checkbox"> 02</li>
                          <li><input type="checkbox"> 15</li>
                        </ul>
                      </li>
                      <li><span class="caret cart-down"><input type="checkbox"> Avril</span>
                        <ul class="nested active">
                          <li><input type="checkbox"> 02</li>
                          <li><input type="checkbox"> 15</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li><span class="caret cart-down"><input type="checkbox"> 2019</span>
                    <ul class="nested active">
                      <li><span class="caret cart-down"><input type="checkbox"> Mai</span>
                        <ul class="nested active">
                          <li><input type="checkbox"> 20</li>
                          <li><input type="checkbox"> 21</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
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
                this.removeFilter(field);
                agGridInstance.paginateData(1);
            });

        // handle filter button event
        this.gui.querySelector('#filter-btn')
            .addEventListener('click', () => {
                this.filterIsActive = true;
                this.invokeFilter();
            });
    }

    /**
     * Run server side filtering based on the selected data
     */
    invokeFilter(){
        var field = this.params.colDef.field;

        if(this.filterExist(field) === false){
            agGridInstance.searchNode.columns.data.push({
                field : field,
                type: 'date',
                data: this.selected
            });
        }else{
            this.removeFilter(field);
            agGridInstance.searchNode.columns.data.push({
                field : field,
                type: 'date',
                data: this.selected
            });
        }
        if(this.selected.length > 0){
            this.hideFilter();
            agGridInstance.paginateData(1);
        }else{
            UIkit.modal.alert('(NB) : Vous devez selectionner au moin une date');
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
        this.gui.querySelector('.elements').innerHTML = '<div style="text-align: center; padding: 10px">Chargement...</div>'
        let path = url_filter_Column;
        let entity = this.params.extraFilterParams.entity;
        let bundle = this.params.extraFilterParams.bundle;
        let field = this.params.colDef.field;
        fetch(path, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({entity, bundle, field, type: 'date'})
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                this.elements = data.map(o => o[field]);
                console.log(this.elements);
                this.filtered = [...this.elements];
                this.selected = [...this.filtered];

                this.buildElementsList();
                this.handleSelectAllCheckbox();
            });
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
    buildElementsList() {
        let view = '<ul class="date-tree">';
        let tree = {};
        let containsEmptyData = false;
        // build tree object
        for (const date of this.filtered) {
            if (date !== 'Vide') {
                let temp = tree;
                let d = new Date(date);
                let formatted = this.formatDate(d);
                let splitted = formatted.split('-');
                let counter = 0;
                for (const key of splitted) {
                    if (!temp[key]) {
                        temp[key] = counter === 2 ? formatted : {};
                    }
                    temp = temp[key];
                    counter++;
                }
            } else {
                containsEmptyData = true;
            }
        }

        // build tree DOM
        for (const y in tree) {
            view += `
                <li class="parent-year">
                    <span class="caret cart-down"></span>
                    <input type="checkbox" class="date-checkbox" checked> ${y}
                    <ul class="nested active">
            `;
            for (const m in tree[y]) {
                view += `
                    <li class="parent-month">
                        <span class="caret cart-down"></span>
                        <input type="checkbox" class="date-checkbox" checked> ${this.MONTHS[m-1]}
                        <ul class="nested active">
                `;
                for (const d in tree[y][m]) {
                    view += `<li class="parent-day"><input type="checkbox" value="${tree[y][m][d]}" class="date-checkbox day-checkbox" checked> ${d}</li>`;
                }
                view += `</ul></li>`;
            }
            view += `</ul></li>`;
        }

        this.gui.querySelector('.elements').innerHTML = view;

        let carets = this.gui.querySelectorAll('.caret');
        carets.forEach((elem) => {
            elem.addEventListener('click', (e) => {
                e.target.parentElement.querySelector(".nested").classList.toggle("active");
                e.target.classList.toggle("caret-down");
            });
        });

        let checkboxes = this.gui.querySelectorAll('.date-checkbox');
        checkboxes.forEach(elem => {
            elem.addEventListener('click', (e) => {
                this.manageCheckboxSelection(elem);
                this.elementChecked(e.target.checked, e.target.value);
            });
        });
    }

    /**
     * Handle the tree's checkbox selection
     * if month is checked all his children should be checked and parent too and so on..
     */
    manageCheckboxSelection(elem){
        let currentLI = $(elem).closest('li');
        if(elem.checked){
            if(currentLI.attr('class') === 'parent-month'){
                currentLI.closest('.parent-year').find('> [type=checkbox]').prop('checked', true);
            }else if(currentLI.attr('class') === 'parent-day'){
                currentLI.closest('.parent-month').find('> [type=checkbox]').prop('checked', true);
                currentLI.closest('.parent-month').closest('.parent-year').find('> [type=checkbox]').prop('checked', true);
            }
            currentLI.find('[type=checkbox]').prop('checked', true);
        }else{
            if(currentLI.attr('class') === 'parent-month'){
                let cd = currentLI.closest('.nested').find('> li > [type=checkbox]:checked').length;
                if(cd === 0) currentLI.closest('.parent-year').find('> [type=checkbox]').prop('checked', false);
            }else if(currentLI.attr('class') === 'parent-day'){
                let cd = currentLI.closest('.nested').find('> li > [type=checkbox]:checked').length;
                if(cd === 0) currentLI.closest('.parent-month').find('> [type=checkbox]').prop('checked', false);
                console.log('checked days', cd);
                let parentMonth = currentLI.closest('.parent-month');
                let cm = parentMonth.closest('.nested').find('> li > [type=checkbox]:checked').length;
                if(cm === 0) parentMonth.closest('.parent-year').find('> [type=checkbox]').prop('checked', false);
            }
            currentLI.find('[type=checkbox]').prop('checked', false);
        }
    }

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
            this.gui.querySelectorAll('.date-checkbox').forEach((elem) => {
                elem.checked = checked;
            });
        }else{
            this.selected = [];
            this.gui.querySelectorAll('.parent-day').forEach((elem) => {
                let checkbox = elem.querySelector('.date-checkbox');
                if(checkbox.checked) this.selected.push(checkbox.value);
            });
            this.handleSelectAllCheckbox();
        }

        console.log('selected', this.selected);
        console.log('filtered', this.filtered);
    }

    /**
     * Handle the "select all checkbox" (selected or not) based on the selected and filtered elements
     */
    handleSelectAllCheckbox(){
        this.gui.querySelector('#select-all-checkbox').checked = (this.selected.length === this.filtered.length);
    }

    formatDate(d) {
        let date = new Date(d);
        var res = `${date.getFullYear()}-`;
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if(month>=10) {
            res = res + `${month}-`;
        }else{
            res = res + `0${month}-`;
        }
        if(day>=10) {
            res = res + `${day}`;
        }else{
            res = res + `0${day}`;
        }
        return res;
    }

    style = () => {
        return `
            .sbc-date-filter-container input{
                width: 96%;
            }
            
            .sbc-date-filter-container .all-checkbox-container{
                margin-top: 5px;
            }
            
            .sbc-date-filter-container .elements{
                border: solid 1px #ababab;
                margin-top: 5px;
                margin-bottom: 5px;
                height: 150px;
                overflow: auto;
            }
            
            .sbc-date-filter-container input[type=checkbox]{
                opacity: 1;
                position: unset;
                width: auto;
                vertical-align: middle;
            }
            
            .sbc-date-filter-container label{
                color: #8d8d8d;
                font-size: 11px;
                white-space: nowrap;
            }
            
            .sbc-date-filter-container button{
                margin-right: 5px;
            }
            
            .sbc-date-filter-container{
                width: 200px;
                padding: 5px;
            }
            
            .sbc-date-filter-container ul, #myUL {
              list-style-type: none;
            }
            
            /* Remove margins and padding from the parent ul */
            .sbc-date-filter-container .date-tree {
              margin: 0;
              padding: 0;
            }
            
            /* Style the caret/arrow */
            .sbc-date-filter-container .caret {
              cursor: pointer;
              user-select: none; /* Prevent text selection */
            }
            
            /* Create the caret/arrow with a unicode, and style it */
            .sbc-date-filter-container .caret::before {
              content: "\\25B6";
              color: black;
              display: inline-block;
              margin-right: 6px;
            }
            
            /* Rotate the caret/arrow icon when clicked on (using JavaScript) */
            .sbc-date-filter-container .caret-down::before {
              transform: rotate(90deg);
            }
            
            /* Hide the nested list */
            .sbc-date-filter-container .nested {
              display: none;
            }
            
            /* Show the nested list when the user clicks on the caret/arrow (with JavaScript) */
            .sbc-date-filter-container .active {
              display: block;
            }
        `;
    }
}
