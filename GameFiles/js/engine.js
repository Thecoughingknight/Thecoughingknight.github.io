/**
 * ENGINE.JS - The Logic & Physics Core
 */

class Node {
    constructor(type, pins, gateType, x = 100, y = 100, savedData = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type; // 'gate', 'input', 'output'
        this.gateType = gateType;
        this.x = x;
        this.y = y;
        this.pins = pins;
        this.label = savedData?.label || "";
        
        // State
        this.numInputs = (type === 'gate') ? pins : (type === 'output' ? 1 : 0);
        this.numOutputs = (type === 'gate') ? 1 : (type === 'input' ? 1 : 0);
        this.inputStates = Array(this.numInputs).fill(false);
        this.outputStates = Array(this.numOutputs).fill(false);

        // Special Properties
        this.timerInterval = savedData?.timerInterval || 1000;
        this.timerId = null;

        this.element = this.createDOM();
        this.initLogic();
        this.updatePosition();
    }

    initLogic() {
        if (this.gateType === 'timer') {
            this.timerId = setInterval(() => {
                this.outputStates[0] = !this.outputStates[0];
                app.runLogic();
            }, this.timerInterval);
        }
        if (this.gateType === 'nand' || this.gateType === 'not') this.outputStates[0] = true;
    }

    createDOM() {
        const div = document.createElement('div');
        div.className = `node node-${this.type === 'gate' ? 'gate' : 'io'}`;
        
        // Inner Content
        const label = document.createElement('div');
        label.className = 'node-label';
        label.innerText = this.label || (this.gateType || this.type).toUpperCase();
        div.appendChild(label);

        // Interaction Listeners
        div.onmousedown = (e) => {
            if (e.shiftKey) {
                e.stopPropagation();
                this.gateType === 'timer' ? app.openTimerModal(this) : app.openLabelModal(this);
                return;
            }
            app.startDragging(this, e);
        };

        // Hover tracking for 'Delete' shortcut in main.js
        div.onmouseenter = () => { app.hoveredNode = this; };
        div.onmouseleave = () => { if(app.hoveredNode === this) app.hoveredNode = null; };

        // Handle Input Toggles
        if (this.type === 'input') {
            div.onclick = (e) => {
                if (e.shiftKey) return;
                this.outputStates[0] = !this.outputStates[0];
                div.classList.toggle('active', this.outputStates[0]);
                app.runLogic();
            };
        }

        this.createPorts(div);
        document.getElementById('canvas-container').appendChild(div);
        return div;
    }

    createPorts(parent) {
        const spacing = 20;
        for (let i = 0; i < this.numInputs; i++) {
            const p = document.createElement('div');
            p.className = 'port port-in';
            p.style.top = `${25 + i * spacing}px`;
            p.onmouseup = (e) => { e.stopPropagation(); app.completeWire(this, i); };
            parent.appendChild(p);
        }
        for (let i = 0; i < this.numOutputs; i++) {
            const p = document.createElement('div');
            p.className = 'port port-out';
            p.style.top = `${25 + i * spacing}px`;
            p.onmousedown = (e) => { e.stopPropagation(); app.startWire(this, i); };
            parent.appendChild(p);
        }
    }

    evaluate() {
        const oldState = JSON.stringify(this.outputStates);
        if (this.type === 'gate') {
            const a = this.inputStates[0];
            const b = this.inputStates[1];
            switch (this.gateType) {
                case 'and':  this.outputStates[0] = (a && b); break;
                case 'nand': this.outputStates[0] = !(a && b); break;
                case 'or':   this.outputStates[0] = (a || b); break;
                case 'not':  this.outputStates[0] = !a; break;
                case 'delay': this.outputStates[0] = a; break;
            }
        }
        if (this.type === 'output') this.element.classList.toggle('active', this.inputStates[0]);
        return oldState !== JSON.stringify(this.outputStates);
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    getPortPos(isInput, idx) {
        const rect = this.element.getBoundingClientRect();
        return {
            x: isInput ? this.x : this.x + rect.width,
            y: this.y + 25 + (idx * 20) + 5
        };
    }

    destroy() {
        if (this.timerId) clearInterval(this.timerId);
        this.element.remove();
    }
}

// Logic Orchestration
Object.assign(app, {
    nodes: [],
    wires: [],
    activeWire: null,
    draggingNode: null,
    offset: { x: 0, y: 0 },
    svg: document.getElementById('wire-layer'),

    addNode(type, pins, gateType, savedData = null) {
        const n = new Node(type, pins, gateType, 150, 150, savedData);
        this.nodes.push(n);
        this.runLogic();
        return n;
    },

    startWire(node, idx) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "wire wire-drag");
        this.svg.appendChild(path);
        this.activeWire = { fromNode: node, fromIdx: idx, element: path };
    },

    completeWire(toNode, toIdx) {
        if (!this.activeWire || this.activeWire.fromNode === toNode) return;
        const wire = { ...this.activeWire, toNode, toIdx };
        wire.element.setAttribute("class", "wire");
        this.wires.push(wire);
        this.activeWire = null;
        this.runLogic();
    },

    runLogic() {
        this.nodes.forEach(n => n.inputStates.fill(false));
        for (let i = 0; i < 5; i++) {
            this.wires.forEach(w => {
                w.toNode.inputStates[w.toIdx] = w.fromNode.outputStates[w.fromIdx];
            });
            this.nodes.forEach(n => n.evaluate());
        }
        this.updateWireVisuals();
    },

    updateWireVisuals() {
        this.wires.forEach(w => {
            const p1 = w.fromNode.getPortPos(false, w.fromIdx);
            const p2 = w.toNode.getPortPos(true, w.toIdx);
            const ctrl = Math.abs(p1.x - p2.x) / 2;
            const d = `M ${p1.x} ${p1.y} C ${p1.x + ctrl} ${p1.y}, ${p2.x - ctrl} ${p2.y}, ${p2.x} ${p2.y}`;
            w.element.setAttribute("d", d);
            w.element.classList.toggle('active', w.fromNode.outputStates[w.fromIdx]);
        });
    }
});
