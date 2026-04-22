// State
const answers = {};
const totalSteps = 8;
let currentStep = 1;

// Init DOM
document.addEventListener('DOMContentLoaded', () => {
    renderDots();
    // Set default date for step 7
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    document.getElementById('examDate').valueAsDate = tomorrow;
});

function selectOption(key, value, nextStepNum) {
    answers[key] = value;
    goToStep(nextStepNum);
}

function finishDate() {
    const val = document.getElementById('examDate').value;
    if (val) {
        const selectedDate = new Date(val);
        const today = new Date();
        const diffTime = Math.abs(selectedDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('res-days').innerText = `${diffDays} kun`;
    }

    goToStep(8);
    fireConfetti();
}

function goToStep(stepNum) {
    // Hide all
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));

    // Show target
    const target = document.querySelector(`.step[data-step="${stepNum}"]`);
    if (target) {
        target.classList.add('active');
        currentStep = stepNum;
        updateDots();
    }
}

function renderDots() {
    const container = document.getElementById('dots');
    container.innerHTML = '';
    // Show 6 dots for flow representation
    for (let i = 1; i <= 6; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i === 1) dot.classList.add('active');
        container.appendChild(dot);
    }
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    // Map 8 steps roughly to 6 dots to match original design feel
    const dotIndex = Math.min(Math.floor(currentStep / 1.5), 5);
    dots.forEach((d, i) => {
        if (i === dotIndex) d.classList.add('active');
        else d.classList.remove('active');
    });
}

function completeApp() {
    alert("Ma'lumotlar saqlandi: " + JSON.stringify(answers) + "\n\nEndi avtorizatsiya/telefon kiritish sahifasiga o'tadi.");
}

// Confetti System
function fireConfetti() {
    const canvas = document.getElementById('confetti');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF'];

    for (let i = 0; i < 100; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2 + 50,
            r: Math.random() * 6 + 2,
            dx: Math.random() * 10 - 5,
            dy: Math.random() * -15 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleInc: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            p.tiltAngle += p.tiltAngleInc;
            p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle) * 2 + p.dx;
            p.dy += 0.1; // gravity
            p.y += p.dy;

            if (p.y <= canvas.height) active = true;

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();
        });

        if (active) requestAnimationFrame(render);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    render();
}
