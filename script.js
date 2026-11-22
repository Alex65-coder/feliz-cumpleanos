const sobre = document.getElementById('sobre');
const textoGuia = document.getElementById('textoGuia');
const btnConfeti = document.getElementById('btnConfeti');
const btnMusica = document.getElementById('btnMusica');
const canvas = document.getElementById('lienzoConfeti');
const ctx = canvas.getContext('2d');

let cartaAbierta = false;
let particulas = [];
let animacionActiva = false;
let audioCtx = null;
let tocandoMusica = false;
let temporizadoresNotas = [];

function ajustarLienzo() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', ajustarLienzo);
ajustarLienzo();

const colores = ['#ff2e58', '#ffd166', '#06d6a0', '#118ab2', '#ffffff', '#c77dff', '#ff9f1c'];

function crearExplosionConfeti() {
    const cantidad = 120;
    const origenX = canvas.width / 2;
    const origenY = canvas.height * 0.55;

    for (let i = 0; i < cantidad; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = Math.random() * 14 + 5;
        particulas.push({
            x: origenX,
            y: origenY,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad - 6,
            tamano: Math.random() * 8 + 5,
            color: colores[Math.floor(Math.random() * colores.length)],
            rotacion: Math.random() * 360,
            velRotacion: (Math.random() - 0.5) * 12,
            forma: Math.random() > 0.3 ? 'rect' : 'circulo',
            opacidad: 1
        });
    }

    if (!animacionActiva) {
        animacionActiva = true;
        animarConfeti();
    }
}

function animarConfeti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.vx *= 0.98;
        p.rotacion += p.velRotacion;

        if (p.y > canvas.height - 60) {
            p.opacidad -= 0.03;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacidad);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotacion * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.forma === 'rect') {
            ctx.fillRect(-p.tamano / 2, -p.tamano / 2, p.tamano, p.tamano * 0.6);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.tamano / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        if (p.opacidad <= 0 || p.y > canvas.height + 20) {
            particulas.splice(i, 1);
        }
    }

    if (particulas.length > 0) {
        requestAnimationFrame(animarConfeti);
    } else {
        animacionActiva = false;
    }
}

// --- MOTOR DE CAJITA MUSICAL ("Feliz Cumpleaños") ---
function tocarNota(frecuencia, duracion, tiempoInicio) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const ganancia = audioCtx.createGain();

    osc.type = 'sine'; // Tono dulce tipo cajita musical
    osc.frequency.setValueAtTime(frecuencia, tiempoInicio);

    // Suavizado para evitar chasquidos
    ganancia.gain.setValueAtTime(0.001, tiempoInicio);
    ganancia.gain.exponentialRampToValueAtTime(0.25, tiempoInicio + 0.03);
    ganancia.gain.exponentialRampToValueAtTime(0.001, tiempoInicio + duracion);

    osc.connect(ganancia);
    ganancia.connect(audioCtx.destination);

    osc.start(tiempoInicio);
    osc.stop(tiempoInicio + duracion);
}

function iniciarMelodia() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    detenerMelodia();
    tocandoMusica = true;
    btnMusica.textContent = '🔊';

    // Frecuencias en Hz de las notas (Do4 a Fa5)
    const N = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
        G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25
    };

    // Partitura: [nota, duración en segundos]
    const cancion = [
        [N.C4, 0.3], [N.C4, 0.3], [N.D4, 0.6], [N.C4, 0.6], [N.F4, 0.6], [N.E4, 1.1],
        [N.C4, 0.3], [N.C4, 0.3], [N.D4, 0.6], [N.C4, 0.6], [N.G4, 0.6], [N.F4, 1.1],
        [N.C4, 0.3], [N.C4, 0.3], [N.C5, 0.6], [N.A4, 0.6], [N.F4, 0.5], [N.E4, 0.5], [N.D4, 1.0],
        [N.Bb4, 0.3], [N.Bb4, 0.3], [N.A4, 0.6], [N.F4, 0.6], [N.G4, 0.6], [N.F4, 1.3]
    ];

    let tiempo = audioCtx.currentTime + 0.1;
    let duracionTotal = 0;

    cancion.forEach(([freq, dur]) => {
        tocarNota(freq, dur * 0.92, tiempo);
        tiempo += dur;
        duracionTotal += dur;
    });

    // Repetir automáticamente cuando termine
    const timer = setTimeout(() => {
        if (tocandoMusica) iniciarMelodia();
    }, duracionTotal * 1000 + 800);
    temporizadoresNotas.push(timer);
}

function detenerMelodia() {
    tocandoMusica = false;
    btnMusica.textContent = '🔇';
    temporizadoresNotas.forEach(t => clearTimeout(t));
    temporizadoresNotas = [];
}

// --- EVENTOS TÁCTILES ---
sobre.addEventListener('pointerdown', (e) => {
    if (!cartaAbierta) {
        e.preventDefault();
        cartaAbierta = true;
        sobre.classList.add('abierto');
        textoGuia.style.opacity = '0';
        btnConfeti.classList.add('visible');
        btnMusica.classList.add('visible');
        
        crearExplosionConfeti();
        iniciarMelodia();
    }
});

btnConfeti.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    crearExplosionConfeti();
});

btnMusica.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (tocandoMusica) {
        detenerMelodia();
    } else {
        iniciarMelodia();
    }
});
