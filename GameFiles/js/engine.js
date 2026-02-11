class Node {
    constructor(id, x, y) {
        this.id = id || Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.element = this.createDOM();
    }

    createDOM() {
        const div = document.createElement('div');
        div.className = 'node';
        div.innerText = 'NAND';
        div.style.left = this.x + 'px';
        div.style.top = this.y + 'px';

        // Dragging Logic
        div.onmousedown = (e) => {
            let shiftX = e.clientX - div.getBoundingClientRect().left;
            let shiftY = e.clientY - div.getBoundingClientRect().top;

            const moveAt = (pageX, pageY) => {
                this.x = pageX - shiftX;
                this.y = pageY - shiftY;
                div.style.left = this.x + 'px';
                div.style.top = this.y + 'px';
            };

            const onMouseMove = (e) => moveAt(e.pageX, e.pageY);
            document.addEventListener('mousemove', onMouseMove);

            div.onmouseup = () => {
                document.removeEventListener('mousemove', onMouseMove);
                div.onmouseup = null;
            };
        };

        document.getElementById('canvas').appendChild(div);
        return div;
    }
}
