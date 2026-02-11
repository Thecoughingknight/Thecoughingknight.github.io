/**
 * MAIN.JS
 * The Orchestrator: Initialization, UI Management, and Input Routing.
 */

window.onload = () => {
    app.init();
};

// Extend the app object with UI and Initialization logic
Object.assign(app, {
    hoveredNode: null,

    init() {
        // 1. Setup Click-to-Close for menus
        document.addEventListener('click', () => {
            document.querySelectorAll('.menu-popup').forEach(m => m.style.display = 'none');
        });

        // 2. Load the library from storage
        this.refreshLibrary();

        // 3. Spawn Initial Scene (v0.8 Style)
        const t = this.addNode('gate', 0, 'timer');
        t.x = 100; t.y = 200; t.updatePosition();
        
        const d = this.addNode('gate', 1, 'delay');
        d.x = 250; d.y = 200; d.updatePosition();

        const o = this.addNode('output', 1);
        o.x = 400; o.y = 200; o.updatePosition();

        console.log("LogicSim Pro Initialized.");
    },

    // --- UI MODAL CONTROL ---
    
    showSaveModal() {
        document.getElementById('save-modal').style.display = 'flex';
        document.getElementById('chip-name').focus();
    },

    openTimerModal(node) {
        this.editingTimerNode = node;
        const input = document.getElementById('timer-interval-input');
        input.value = node.timerInterval || 1000;
        document.getElementById('timer-modal').style.display = 'flex';
        input.focus();
    },

    openLabelModal(node) {
        this.labelingNode = node;
        const input = document.getElementById('node-label-input');
        input.value = node.label || "";
        document.getElementById('label-modal').style.display = 'flex';
        input.focus();
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        this.labelingNode = null;
        this.editingTimerNode = null;
    },

    // --- CHIP ACTIONS ---

    saveCurrentChip() {
        const nameInput = document.getElementById('chip-name');
        const name = nameInput.value.trim();
        if (name) {
            storage.saveChip(name);
            this.closeModals();
            nameInput.value = "";
        }
    },

    saveTimerSettings() {
        if (this.editingTimerNode) {
            let val = parseInt(document.getElementById('timer-interval-input').value);
            if (val < 50) val = 50; // Safety floor
            this.editingTimerNode.timerInterval = val;
            // Restart the timer with new interval
            clearInterval(this.editingTimerNode.timerId);
            this.editingTimerNode.initSpecialLogic();
        }
        this.closeModals();
    },

    confirmLabel() {
        if (this.labelingNode) {
            const val = document.getElementById('node-label-input').value.trim();
            this.labelingNode.label = val;
            // Update visual label if it exists
            let lbl = this.labelingNode.element.querySelector('.node-label');
            if (!lbl && val) {
                lbl = document.createElement('div');
                lbl.className = 'node-label';
                this.labelingNode.element.appendChild(lbl);
            }
            if (lbl) lbl.innerText = val;
        }
        this.closeModals();
    },

    clearCanvas() {
        this.nodes.forEach(n => n.destroy());
        this.wires.forEach(w => w.element.remove());
        this.nodes = [];
        this.wires = [];
        this.runLogic();
    },

    toggleMenu(e, id) {
        e.stopPropagation();
        const el = document.getElementById(id);
        const isOpen = el.style.display === 'flex';
        document.querySelectorAll('.menu-popup').forEach(m => m.style.display = 'none');
        el.style.display = isOpen ? 'none' : 'flex';
    },

    refreshLibrary() {
        const library = storage.loadLibrary();
        const list = document.getElementById('custom-chips-list');
        if (!list) return;

        list.innerHTML = library.length ? '' : '<div class="menu-item italic" style="opacity:0.5">No custom chips</div>';
        
        library.forEach(chip => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            
            const nameSpan = document.createElement('span');
            nameSpan.innerText = chip.name;
            nameSpan.onclick = () => this.addNode('gate', chip.numIn, chip.name, chip);

            const delBtn = document.createElement('span');
            delBtn.innerHTML = '&times;';
            delBtn.style.padding = '0 5px';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                storage.deleteChip(chip.name);
            };

            item.appendChild(nameSpan);
            item.appendChild(delBtn);
            list.appendChild(item);
        });
    }
});

/**
 * GLOBAL KEYBOARD SHORTCUTS
 */
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 's') { e.preventDefault(); app.showSaveModal(); }
    if (ctrl && e.key === 'n') { e.preventDefault(); if(confirm("Clear Canvas?")) app.clearCanvas(); }
    if (ctrl && e.key === 'f') { e.preventDefault(); app.toggleMenu(e, 'library-menu'); }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (app.hoveredNode) {
            app.hoveredNode.destroy();
            app.nodes = app.nodes.filter(n => n !== app.hoveredNode);
            // Cleanup wires connected to it
            app.wires = app.wires.filter(w => {
                if (w.fromNode === app.hoveredNode || w.toNode === app.hoveredNode) {
                    w.element.remove();
                    return false;
                }
                return true;
            });
            app.runLogic();
            app.hoveredNode = null;
        }
    }
    if (e.key === 'Escape') app.closeModals();
});
