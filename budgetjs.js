    const name = localStorage.getItem("userName") || "Guest";
    const email = localStorage.getItem("userEmail") || "Not Provided";

    document.getElementById("displayName").textContent = name;
    document.getElementById("displayEmail").textContent = email;

document.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById('splash');
    const main = document.getElementById('main-content');

    setTimeout(() => {
        splash.style.opacity = '0'; 
        splash.style.transition = 'opacity 1s ease';
        setTimeout(() => {
            splash.style.display = 'none';
            main.style.display = 'block';
        }, 1000);
    }, 2500); 
});

let db;
const request = indexedDB.open("DynamicTableDB", 9);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
    if (!db.objectStoreNames.contains("cells")) db.createObjectStore("cells", { keyPath: "key" });
};

request.onsuccess = function(e) {
    db = e.target.result;
    initTable();
};

request.onerror = function(e) {
    console.error("IndexedDB error:", e.target.errorCode);
};

function getMeta() {
    return new Promise(resolve => {
        const tx = db.transaction("meta","readonly").objectStore("meta").get(1);
        tx.onsuccess = e => resolve(e.target.result);
    });
}

function saveMeta(meta) {
    return new Promise(resolve => {
        const tx = db.transaction("meta","readwrite").objectStore("meta").put(meta);
        tx.onsuccess = () => resolve();
    });
}

function saveCell(r,c,v) {
    return new Promise(resolve => {
        const tx = db.transaction("cells","readwrite").objectStore("cells").put({key:r+","+c, value:v});
        tx.onsuccess = () => resolve();
    });
}

function deleteCell(r,c) {
    return new Promise(resolve => {
        const tx = db.transaction("cells","readwrite").objectStore("cells").delete(r+","+c);
        tx.onsuccess = () => resolve();
    });
}

function getAllCells() {
    return new Promise(resolve => {
        const tx = db.transaction("cells","readonly").objectStore("cells").getAll();
        tx.onsuccess = e => resolve(e.target.result);
    });
}

async function initTable() {
    let meta = await getMeta();
    if (!meta) {
        meta = { id: 1, rows: 2, cols: 2 };
        await saveMeta(meta);
        for (let r=0; r<meta.rows; r++) {
            for (let c=0; c<meta.cols; c++) await saveCell(r,c,"");
        }
    }
    loadTable();
}

function getColumnLabel(index) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cycle = Math.floor(index / 26);
    const letter = letters[index % 26];
    return cycle === 0 ? letter : letter + (cycle + 1);
}

async function loadTable() {
    const meta = await getMeta();
    const cells = await getAllCells();
    const tbody = document.querySelector('#table tbody');
    tbody.innerHTML = '';

    const headerRow = document.createElement('tr');
    const emptyHeader = document.createElement('th'); emptyHeader.textContent='◢'; headerRow.appendChild(emptyHeader);
    for (let c=0; c<meta.cols; c++) {
        const th = document.createElement('th');
        th.textContent = getColumnLabel(c);
        headerRow.appendChild(th);
    }
    headerRow.appendChild(document.createElement('th'));
    tbody.appendChild(headerRow);

    for (let r=0; r<meta.rows; r++) {
        const tr = document.createElement('tr');

        const serialTd = document.createElement('td');
        serialTd.className = 'serial';
        serialTd.textContent = r+1;
        tr.appendChild(serialTd);

        for (let c=0; c<meta.cols; c++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            const cell = cells.find(x => x.key === r+","+c);
            input.value = cell ? cell.value : "";
            input.oninput = () => { saveCell(r,c,input.value); updateTotals(); };
            input.onfocus = () => highlightHeaders(r, c);
            input.onblur = () => removeHighlight();
            td.appendChild(input);

            const handle = document.createElement('div');
            handle.className = 'cell-resize-handle';
            handle.onmousedown = (e) => initCellResize(e, td);
            td.appendChild(handle);

            tr.appendChild(td);
        }

        const tdBtn = document.createElement('td');
        const addBtn = document.createElement('button'); addBtn.textContent='+'; addBtn.className='add-btn'; addBtn.onclick=addColumn;
        const delBtn = document.createElement('button'); delBtn.textContent='🗑'; delBtn.className='delete-btn'; delBtn.onclick=deleteLastColumn;
        tdBtn.appendChild(addBtn); tdBtn.appendChild(delBtn);
        tr.appendChild(tdBtn);

        tbody.appendChild(tr);
    }

    const trAddRow = document.createElement('tr');
    const emptySerial = document.createElement('td'); emptySerial.className='serial'; trAddRow.appendChild(emptySerial);
    for (let c=0; c<meta.cols; c++) {
        const td = document.createElement('td');
        const addBtn = document.createElement('button'); addBtn.textContent='+'; addBtn.className='add-btn'; addBtn.onclick=addRow;
        const delBtn = document.createElement('button'); delBtn.textContent='🗑'; delBtn.className='delete-btn'; delBtn.onclick=deleteLastRow;
        td.appendChild(addBtn); td.appendChild(delBtn);
        trAddRow.appendChild(td);
    }
    trAddRow.appendChild(document.createElement('td'));
    tbody.appendChild(trAddRow);

    updateTotals();
}

async function updateTotals() {
    const meta = await getMeta();
    const tbody = document.querySelector('#table tbody');

    let colTotals = Array(meta.cols).fill(0);
    let grandTotal = 0;

    for (let r=0; r<meta.rows; r++) {
        const tr = tbody.rows[r+1];
        let rowTotal = 0;

        for (let c=0; c<meta.cols; c++) {
            const input = tr.cells[c+1].querySelector('input');
            const val = parseFloat(input.value);
            if (!isNaN(val)) { rowTotal += val; colTotals[c] += val; }
        }

        let rowTotalCell = tr.querySelector('.row-total');
        if (!rowTotalCell) {
            rowTotalCell = document.createElement('td');
            rowTotalCell.className='row-total total-cell';
            tr.insertBefore(rowTotalCell, tr.lastElementChild);
        }
        rowTotalCell.textContent = rowTotal;
        grandTotal += rowTotal;
    }

    let totalRow = tbody.querySelector('.col-total-row');
    if (!totalRow) {
        totalRow = document.createElement('tr'); totalRow.className='col-total-row';
        const labelTd = document.createElement('td'); labelTd.textContent='Total'; labelTd.className='serial'; totalRow.appendChild(labelTd);
        for (let c=0; c<meta.cols; c++) { const td=document.createElement('td'); td.className='col-total total-cell'; totalRow.appendChild(td); }
        const bottomRight=document.createElement('td'); bottomRight.className='total-cell'; totalRow.appendChild(bottomRight);
        tbody.insertBefore(totalRow, tbody.lastElementChild);
    }

    colTotals.forEach((sum,i) => totalRow.cells[i+1].textContent=sum);
    totalRow.cells[meta.cols+1].textContent = grandTotal;
}

async function addRow() {
    const meta = await getMeta();
    const newRow = meta.rows;
    for (let c=0; c<meta.cols; c++) await saveCell(newRow,c,"");
    meta.rows++;
    await saveMeta(meta);
    loadTable();
}

async function addColumn() {
    const meta = await getMeta();
    const newCol = meta.cols;
    for (let r=0; r<meta.rows; r++) await saveCell(r,newCol,"");
    meta.cols++;
    await saveMeta(meta);
    loadTable();
}

async function deleteLastRow() {
    const meta = await getMeta();
    if (meta.rows<=1) return;
    const lastRow = meta.rows-1;
    for (let c=0; c<meta.cols; c++) await deleteCell(lastRow,c);
    meta.rows--;
    await saveMeta(meta);
    loadTable();
}

async function deleteLastColumn() {
    const meta = await getMeta();
    if (meta.cols<=1) return;
    const lastCol = meta.cols-1;
    for (let r=0; r<meta.rows; r++) await deleteCell(r,lastCol);
    meta.cols--;
    await saveMeta(meta);
    loadTable();
}

function highlightHeaders(rowIndex,colIndex){
    document.querySelectorAll('th').forEach(th => th.classList.remove('highlight'));
    document.querySelectorAll('.serial').forEach(td => td.classList.remove('highlight'));
    const header = document.querySelectorAll('th')[colIndex+1];
    const rowHeader = document.querySelectorAll('.serial')[rowIndex];
    if(header) header.classList.add('highlight');
    if(rowHeader) rowHeader.classList.add('highlight');
}
function removeHighlight(){
    document.querySelectorAll('th').forEach(th => th.classList.remove('highlight'));
    document.querySelectorAll('.serial').forEach(td => td.classList.remove('highlight'));
}

let startX,startY,startWidth,startHeight;
function initCellResize(e,cell){
    e.preventDefault();
    startX=e.clientX; startY=e.clientY; startWidth=cell.offsetWidth; startHeight=cell.offsetHeight;

    document.onmousemove=(ev)=>{
        const dx=ev.clientX-startX, dy=ev.clientY-startY;
        cell.style.width = Math.max(40,startWidth+dx)+'px';
        cell.style.height = Math.max(30,startHeight+dy)+'px';
    };

    document.onmouseup=()=>{
        document.onmousemove=null; document.onmouseup=null;
    };
}

function downloadSheet() {
    let csv = [];
    const rows = document.querySelectorAll("#budgetTable tr");

    for (let row of rows) {
        let cols = row.querySelectorAll("td, th");
        let rowData = [];
        for (let col of cols) {
            let text = col.innerText.replace(/"/g, '""');
            rowData.push('"' + text + '"');
        }
        csv.push(rowData.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "budget_sheet.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function toggleRightBar() {
    const bar = document.querySelector(".right-bar");
    bar.classList.toggle("hidden-bar");
}

function toggleBottomBar() {
    const bar = document.querySelector(".bottom-bar");
    bar.classList.toggle("hidden-bottom");
}