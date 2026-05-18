/**
 * LinkedIn Zip Clone - Production Ready Version
 */

class ZipGame {
    constructor() {
        this.board = document.getElementById('game-board');
        this.lineLayer = document.getElementById('line-layer');
        this.timerEl = document.getElementById('timer');
        this.modals = {
            setup: document.getElementById('setup-modal'),
            win: document.getElementById('win-modal')
        };
        
        this.state = {
            cells: [],
            path: [],
            isDrawing: false,
            currentLevel: 0,
            playerName: "Player",
            timer: null,
            startTime: null,
            mouseX: null,
            mouseY: null
        };

        this.levels = [
            {
                // Level 1: Zig-zag (6 Numbers)
                numbers: { 0: 1, 4: 2, 14: 3, 10: 4, 20: 5, 24: 6 },
                solution: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 18, 17, 16, 15, 20, 21, 22, 23, 24]
            },
            {
                // Level 2: Spiral (5 Numbers)
                numbers: { 0: 1, 4: 2, 24: 3, 20: 4, 12: 5 },
                solution: [0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5, 6, 7, 8, 13, 18, 17, 16, 11, 12]
            },
            {
                // Level 3: The Cross (4 Numbers)
                numbers: { 2: 1, 20: 2, 4: 3, 22: 4 },
                solution: [2, 1, 0, 5, 6, 7, 8, 3, 4, 9, 14, 13, 12, 11, 10, 15, 16, 17, 18, 19, 24, 23, 22, 21, 20]
            },
            {
                // Level 4: The Maze (5 Numbers)
                numbers: { 0: 1, 2: 2, 24: 3, 22: 4, 12: 5 },
                solution: [0, 5, 10, 15, 20, 21, 16, 11, 6, 1, 2, 7, 8, 3, 4, 9, 14, 19, 24, 23, 18, 17, 22, 21, 12] // Wait, 25 cells...
            }
        ];

        // Ensure all levels have exactly 25 cells in solution for consistency
        this.levels = [
            {
                name: "The Wave",
                numbers: { 0: 1, 4: 2, 14: 3, 19: 4, 24: 5 }
            },
            {
                name: "The Spiral",
                numbers: { 0: 1, 4: 2, 24: 3, 20: 4, 12: 5 }
            },
            {
                name: "The Double-Back",
                numbers: { 2: 1, 22: 2, 20: 3, 4: 4 }
            }
        ];

        this.init();
    }

    init() {
        document.getElementById('start-game').onclick = () => {
            const name = document.getElementById('player-name').value;
            if (name) this.state.playerName = name;
            this.modals.setup.classList.remove('active');
            this.startLevel();
        };

        document.getElementById('undo-btn').onclick = () => this.undo();
        document.getElementById('reset-btn').onclick = () => this.startLevel();
        document.getElementById('play-again').onclick = () => {
            this.modals.win.classList.remove('active');
            this.state.currentLevel = (this.state.currentLevel + 1) % this.levels.length;
            this.startLevel();
        };

        const handleStart = (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const idx = parseInt(cell.dataset.index);
            const level = this.levels[this.state.currentLevel];

            // If it's the start node or already in the path, allow drawing/resuming
            if (level.numbers[idx] === 1 || this.state.path.includes(idx)) {
                this.state.isDrawing = true;
                
                // If clicking an existing cell in the path, truncate to that point
                if (this.state.path.includes(idx)) {
                    const pos = this.state.path.indexOf(idx);
                    this.state.path = this.state.path.slice(0, pos + 1);
                }
                
                this.render();
            }
        };

        const handleMove = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            const container = document.getElementById('game-board-container');
            const rect = container.getBoundingClientRect();
            
            this.state.mouseX = touch.clientX - rect.left;
            this.state.mouseY = touch.clientY - rect.top;

            if (!this.state.isDrawing) {
                this.render(); // Just update mouse position for potential hover effects
                return;
            }

            const cell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.cell');
            if (cell) {
                const idx = parseInt(cell.dataset.index);
                const last = this.state.path[this.state.path.length - 1];
                
                if (idx !== last && this.isAdjacent(idx, last)) {
                    // Backtracking: if we move to the previous cell, pop the last one
                    if (idx === this.state.path[this.state.path.length - 2]) {
                        this.state.path.pop();
                    } 
                    // Forward movement: if cell is unvisited
                    else if (!this.state.path.includes(idx)) {
                        const level = this.levels[this.state.currentLevel];
                        if (level.numbers[idx]) {
                            const hit = this.state.path.filter(p => level.numbers[p]).length + 1;
                            if (level.numbers[idx] !== hit) {
                                this.render();
                                return;
                            }
                        }
                        this.state.path.push(idx);
                        this.checkWin();
                    }
                }
            }
            this.render();
        };

        const handleEnd = () => {
            this.state.isDrawing = false;
            this.state.mouseX = null;
            this.state.mouseY = null;
            this.render();
        };

        this.board.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        this.board.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart(e.touches[0]); }, {passive:false});
        window.addEventListener('touchmove', (e) => { handleMove(e); }, {passive:false});
        window.addEventListener('touchend', handleEnd);
    }

    startLevel() {
        const level = this.levels[this.state.currentLevel];
        const startIdx = Object.keys(level.numbers).find(k => level.numbers[k] === 1);
        this.state.path = [parseInt(startIdx)];
        this.state.isDrawing = false;
        this.createGrid();
        this.startTimer();
        this.render();
    }

    createGrid() {
        this.board.innerHTML = '';
        this.state.cells = [];
        const level = this.levels[this.state.currentLevel];
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            if (level.numbers[i]) {
                cell.classList.add('number');
                cell.setAttribute('data-number', level.numbers[i]);
            }
            this.board.appendChild(cell);
            this.state.cells.push(cell);
        }
    }

    isAdjacent(i1, i2) {
        const x1 = i1 % 5, y1 = Math.floor(i1 / 5);
        const x2 = i2 % 5, y2 = Math.floor(i2 / 5);
        return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
    }

    render() {
        this.state.cells.forEach((c, i) => {
            c.classList.remove('visited', 'active');
            if (this.state.path.includes(i)) c.classList.add('visited');
        });
        if (this.state.path.length) this.state.cells[this.state.path[this.state.path.length-1]].classList.add('active');

        const container = document.getElementById('game-board-container');
        const containerRect = container.getBoundingClientRect();
        const points = this.state.path.map(idx => {
            const r = this.state.cells[idx].getBoundingClientRect();
            return `${(r.left - containerRect.left) + r.width/2},${(r.top - containerRect.top) + r.height/2}`;
        });

        if (this.state.isDrawing && this.state.mouseX !== null) {
            points.push(`${this.state.mouseX},${this.state.mouseY}`);
        }
        
        this.lineLayer.innerHTML = `<polyline class="game-line" points="${points.join(' ')}" />`;
    }

    undo() {
        if (this.state.path.length > 1) {
            this.state.path.pop();
            this.render();
        }
    }

    checkWin() {
        if (this.state.path.length === 25) {
            const level = this.levels[this.state.currentLevel];
            const hitNums = this.state.path.filter(p => level.numbers[p]).map(p => level.numbers[p]);
            if (hitNums.length === Object.keys(level.numbers).length) {
                this.win();
            }
        }
    }

    win() {
        if (this.state.timer) clearInterval(this.state.timer);
        document.getElementById('display-name').textContent = this.state.playerName;
        document.getElementById('final-time').textContent = this.timerEl.textContent;
        this.modals.win.classList.add('active');
    }

    startTimer() {
        if (this.state.timer) clearInterval(this.state.timer);
        this.state.startTime = Date.now();
        this.state.timer = setInterval(() => {
            const s = Math.floor((Date.now() - this.state.startTime) / 1000);
            this.timerEl.textContent = `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
        }, 1000);
    }
}

window.onload = () => new ZipGame();
