/**
 * ENGINE.JS
 * Handles: Logic evaluation, Node management, and Bezier Curve rendering.
 */

class Node {
    constructor(type, x, y, pins, gateType, internalLogic = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type; // 'gate', 'input', or 'output'
        this.gateType = gateType; // 'nand', 'and', 'timer', etc.
        this.x = x;
        this.y = y;
        this.pins = pins;
        this.label = "";
        this.internalLogic = internalLogic;

        // Logic State
        this.numInputs = (type === 'gate') ? pins : (type === 'output' ? pins : 0);
        this.numOutputs = (type === 'gate') ? (internalLogic ? internalLogic.numOut : 1) : (type === 'input' ? pins : 0);
        
        this.inputStates = Array(this.numInputs).fill(false);
        this.outputStates = Array(this.numOutputs).fill(false);

        // Timer/Delay specifics
        this.timerInterval = 1000;
        this.timerId = null;

        // Visuals
        this.element = this.createDOM();
        this.initSpecialLogic();
        this.updatePosition();
    }

    initSpecialLogic() {
        if (this.gateType === 'timer') {
            this.timerId = setInterval(() => {
                this.outputStates[0] = !this.outputStates[0];
                app.runLogic();
            }, this.timerInterval);
        }
        // Default NAND to TRUE (since 0 & 0 inverted is 1)
        if (this.gateType === 'nand' || this.gateType === 'not') {
            this.outputStates[0] = true;
        }
    }

    createDOM() {
        const div = document.createElement('div');
        div.className = `node node-${this.type === 'gate' ? 'gate' : 'io'}`;
        if (this.gateType === 'timer' || this.gateType === 'delay') div.classList.add('node-special');

        // Body Text
        const body = document.createElement('div');
        body.innerText = (this.gateType || this.type).toUpperCase();
        div.appendChild(body);

        // IO Click handling
        if (this.type === 'input') {
            const circle = document.createElement('div');
            circle.className = 'io-circle';
            circle.onclick = (e) => {
                e.stopPropagation();
                this.outputStates[0] = !this.outputStates[0];
                circle.classList.toggle('active', this.outputStates[0]);
                app.runLogic();
            };
            div.appendChild(circle);
        }

        if (this.type === 'output') {
            const circle = document.createElement('div');
            circle.className = 'io-circle';
            div.appendChild(circle);
        }

        // Ports
        this.createPorts(div);

        // Dragging
        div.onmousedown = (e) => app.startDragging(this, e);
        
        document.getElementById('canvas-container').appendChild(div);
        return div;
    }

    createPorts(parent) {
        const rowH = 20;
        // Inputs (Left side)
        for (let i = 0; i < this.numInputs; i++) {
            const p = document.createElement('div');
            p.className = 'port port-in';
            p.style.top = (this.numInputs > 1) ? `${15 + i * rowH}px` : '50%';
            p.onmouseup = (e) => { e.stopPropagation(); app.completeWire(this, i); };
            parent.appendChild(p);
        }
        // Outputs (Right side)
        for (let i = 0; i < this.numOutputs; i++) {
            const p = document.createElement('div');
            p.className = 'port port-out';
            p.style.top = (this.numOutputs > 1) ? `${15 + i * rowH}px` : '50%';
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
                case 'nand': this.outputStates[0] = !(a && b); break;
                case 'and':  this.outputStates[0] = (a && b); break;
                case 'or':   this.outputStates[0] = (a || b); break;
                case 'not':  this.outputStates[0] = !a; break;
                case 'delay': 
                    // Simple pass-through for demo, actual delay uses setTimeout
                    this.outputStates[0] = a; 
                    break;
            }
        }

        if (this.type === 'output') {
            const circle = this.element.querySelector('.io-circle');
            if (circle) circle.classList.toggle('active', this.inputStates[0]);
        }

        return oldState !== JSON.stringify(this.outputStates);
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    getPortPos(isInput, idx) {
        const rect = this.element.getBoundingClientRect();
        const rowH = 20;
        const count = isInput ? this.numInputs : this.numOutputs;
        let yOffset = (count > 1) ? (15 + idx * rowH + 5) : (rect.height / 2);
        
        return {
            x: isInput ? this.x : this.x + rect.width,
            y: this.y + yOffset
        };
    }

    destroy() {
        if (this.timerId) clearInterval(this.timerId);
        this.element.remove();
    }
}

// Global App Logic for Engine
const app = {
    nodes: [],
    wires: [],
    activeWire: null,
    draggingNode: null,
    offset: { x: 0, y: 0 },
    svg: document.getElementById('wire-layer'),

    addNode(type, pins, gateType) {
        const n = new Node(type, 100, 100, pins, gateType);
        this.nodes.push(n);
        this.runLogic();
    },

    startDragging(node, e) {
        this.draggingNode = node;
        this.offset.x = e.clientX - node.x;
        this.offset.y = e.clientY - node.y;
    },

    startWire(node, idx) {
        const pos = node.getPortPos(false, idx);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "wire wire-drag");
        this.svg.appendChild(path);
        this.activeWire = { fromNode: node, fromIdx: idx, element: path };
    },

    completeWire(toNode, toIdx) {
        if (!this.activeWire) return;
        const wire = { ...this.activeWire, toNode, toIdx };
        wire.element.setAttribute("class", "wire");
        this.wires.push(wire);
        this.activeWire = null;
        this.runLogic();
    },

    runLogic() {
        // Simple propagation: Reset inputs then re-calculate
        this.nodes.forEach(n => n.inputStates.fill(false));
        
        // Loop multiple times to handle multi-stage propagation
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
            
            // --- S-CURVE BEZIER MATH ---
            const ctrlX = Math.abs(p1.x - p2.x) / 2;
            const d = `M ${p1.x} ${p1.y} C ${p1.x + ctrlX} ${p1.y}, ${p2.x - ctrlX} ${p2.y}, ${p2.x} ${p2.y}`;
            
            w.element.setAttribute("d", d);
            w.element.classList.toggle('active', w.fromNode.outputStates[w.fromIdx]);
        });
    }
};

// Global Mouse Listeners
window.onmousemove = (e) => {
    if (app.draggingNode) {
        app.draggingNode.x = e.clientX - app.offset.x;
        app.draggingNode.y = e.clientY - app.offset.y;
        app.draggingNode.updatePosition();
        app.updateWireVisuals();
    }
    if (app.activeWire) {
        const p1 = app.activeWire.fromNode.getPortPos(false, app.activeWire.fromIdx);
        app.activeWire.element.setAttribute("d", `M ${p1.x} ${p1.y} L ${e.clientX} ${e.clientY}`);
    }
};

window.onmouseup = () => {
    app.draggingNode = null;
    if (app.activeWire) {
        app.activeWire.element.remove();
        app.activeWire = null;
    }
};
