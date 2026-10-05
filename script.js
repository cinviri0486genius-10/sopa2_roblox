const WORDS = ["SCRIPT", "WORKSPACE", "PART", "ANCHORED", "HUMANOID", "VECTOR3", "TWEENSERVICE", "MODEL"];
const GRID_SIZE = 15;
let grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
let isSelecting = false;
let startCell = null;
let foundWordsCount = 0;

// Inicializar lista de palabras en pantalla
const wordListEl = document.getElementById('word-list');
WORDS.forEach(word => {
    const li = document.createElement('li');
    li.innerText = word;
    li.id = `word-${word}`;
    wordListEl.appendChild(li);
});

// Intentar colocar una palabra en la cuadrícula
function placeWord(word) {
    const directions = [
        {x: 1, y: 0},   // Horizontal derecha
        {x: 0, y: 1},   // Vertical abajo
        {x: 1, y: 1},   // Diagonal abajo-derecha
    ];

    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 150) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (canPlace(word, row, col, dir)) {
            for (let i = 0; i < word.length; i++) {
                grid[row + i * dir.y][col + i * dir.x] = word[i];
            }
            placed = true;
        }
        attempts++;
    }
}

function canPlace(word, row, col, dir) {
    if (row + (word.length - 1) * dir.y >= GRID_SIZE || row + (word.length - 1) * dir.y < 0) return false;
    if (col + (word.length - 1) * dir.x >= GRID_SIZE || col + (word.length - 1) * dir.x < 0) return false;
    
    for (let i = 0; i < word.length; i++) {
        const currentCell = grid[row + i * dir.y][col + i * dir.x];
        if (currentCell !== '' && currentCell !== word[i]) return false;
    }
    return true;
}

// Rellenar espacios vacíos con letras aleatorias
function fillEmptyCells() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

// Renderizar la cuadrícula en el HTML
function renderGrid() {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = ''; // Limpiar por seguridad
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.innerText = grid[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Eventos para soportar clic y arrastrar (o clics individuales)
            cell.addEventListener('mousedown', (e) => handleStart(cell));
            cell.addEventListener('mouseenter', (e) => handleHover(cell));
            cell.addEventListener('mouseup', (e) => handleEnd(cell));
            
            // Compatibilidad con pantallas táctiles móviles
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleStart(cell);
            });
            cell.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleEnd(cell);
            });

            gridEl.appendChild(cell);
        }
    }
    
    // Si el usuario suelta el clic fuera de la cuadrícula, reiniciamos la selección
    document.addEventListener('mouseup', () => {
        if (isSelecting) {
            clearSelectionStyles();
            isSelecting = false;
            startCell = null;
        }
    });
}

function handleStart(cell) {
    if (cell.classList.contains('found')) return;
    isSelecting = true;
    startCell = cell;
    cell.classList.add('selected');
}

function handleHover(cell) {
    if (!isSelecting || !startCell) return;
    clearSelectionStyles();
    highlightPath(startCell, cell);
}

function handleEnd(cell) {
    if (!isSelecting || !startCell) return;
    isSelecting = false;
    checkSelection(startCell, cell);
    startCell = null;
}

function clearSelectionStyles() {
    document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
}

// Obtiene el camino de celdas entre el punto inicial y final si es una línea válida
function getPathCells(start, end) {
    const startRow = parseInt(start.dataset.row);
    const startCol = parseInt(start.dataset.col);
    const endRow = parseInt(end.dataset.row);
    const endCol = parseInt(end.dataset.col);

    const dRow = endRow - startRow;
    const dCol = endCol - startCol;

    let stepRow = 0;
    let stepCol = 0;

    if (dRow === 0) stepCol = dCol > 0 ? 1 : -1;
    else if (dCol === 0) stepRow = dRow > 0 ? 1 : -1;
    else if (Math.abs(dRow) === Math.abs(dCol)) {
        stepRow = dRow > 0 ? 1 : -1;
        stepCol = dCol > 0 ? 1 : -1;
    } else {
        return null; // No es horizontal, vertical ni diagonal perfecta
    }

    let cells = [];
    let currRow = startRow;
    let currCol = startCol;

    while (true) {
        const cellEl = document.querySelector(`[data-row='${currRow}'][data-col='${currCol}']`);
        if (cellEl) cells.push(cellEl);
        
        if (currRow === endRow && currCol === endCol) break;
        currRow += stepRow;
        currCol += stepCol;
    }
    return cells;
}

function highlightPath(start, end) {
    const cells = getPathCells(start, end);
    if (cells) {
        cells.forEach(cell => {
            if (!cell.classList.contains('found')) cell.classList.add('selected');
        });
    }
}

function checkSelection(start, end) {
    const cells = getPathCells(start, end);
    if (!cells) {
        clearSelectionStyles();
        return;
    }

    let word = "";
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        word += grid[r][c];
    });

    const reversedWord = word.split('').reverse().join('');

    if (WORDS.includes(word) && !document.getElementById(`word-${word}`).classList.contains('found-word')) {
        markAsFound(word, cells);
    } else if (WORDS.includes(reversedWord) && !document.getElementById(`word-${reversedWord}`).classList.contains('found-word')) {
        markAsFound(reversedWord, cells);
    } else {
        clearSelectionStyles();
    }
}

function markAsFound(word, cells) {
    cells.forEach(cell => {
        cell.classList.remove('selected');
        cell.classList.add('found');
    });
    document.getElementById(`word-${word}`).classList.add('found-word');
    foundWordsCount++;

    if (foundWordsCount === WORDS.length) {
        document.getElementById('message').innerText = "¡Felicidades! Encontraste todos los conceptos.";
    }
}

// Generar juego
WORDS.forEach(placeWord);
fillEmptyCells();
renderGrid();
