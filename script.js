// --------- 1. HOVER EFFECTS FOR LINKS ---------
const links = document.querySelectorAll('.nav-link');
const previewContainer = document.getElementById('media-preview');

links.forEach(link => {
    link.addEventListener('mouseenter', () => {
        const type = link.getAttribute('data-type');
        const src = link.getAttribute('data-src');

        // Clear previous content
        previewContainer.innerHTML = '';

        if (type === 'video') {
            const video = document.createElement('video');
            video.src = src;
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.playsInline = true;
            previewContainer.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = src;
            previewContainer.appendChild(img);
        }

        // Show container
        previewContainer.classList.add('active');
    });

    link.addEventListener('mouseleave', () => {
        previewContainer.classList.remove('active');
        // Optional: clear HTML after transition for performance
        setTimeout(() => {
            if (!previewContainer.classList.contains('active')) {
                previewContainer.innerHTML = '';
            }
        }, 400);
    });
});


// --------- 2. THREE.JS 3D BACKGROUND ---------

const canvas = document.querySelector('#canvas3d');
const scene = new THREE.Scene();

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Objects (Spheres)
const particlesGeometry = new THREE.IcosahedronGeometry(0.5, 0); // Low poly look
const particlesMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    wireframe: true,
});

const particlesCount = 30;
const particles = [];

for (let i = 0; i < particlesCount; i++) {
    const mesh = new THREE.Mesh(particlesGeometry, particlesMaterial);
    
    // Random position
    mesh.position.x = (Math.random() - 0.5) * 15;
    mesh.position.y = (Math.random() - 0.5) * 10;
    mesh.position.z = (Math.random() - 0.5) * 5;

    // Custom velocity for floating animation
    mesh.userData = {
        velX: (Math.random() - 0.5) * 0.01,
        velY: (Math.random() - 0.5) * 0.01,
        initialX: mesh.position.x,
        initialY: mesh.position.y
    };

    scene.add(mesh);
    particles.push(mesh);
}

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Animation Loop
const clock = new THREE.Clock();

const tick = () => {
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    particles.forEach(mesh => {
        // 1. Basic floating
        mesh.rotation.x += 0.002;
        mesh.rotation.y += 0.002;
        
        mesh.position.x += mesh.userData.velX;
        mesh.position.y += mesh.userData.velY;

        // 2. Mouse Repulsion / Attraction
        // This calculates distance between mouse and object
        const dx = (mouseX / window.innerWidth) * 15 - mesh.position.x;
        const dy = -(mouseY / window.innerHeight) * 10 - mesh.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If mouse is close, push object away slightly
        if (dist < 3) {
            const force = (3 - dist) * 0.05;
            mesh.position.x -= dx * force;
            mesh.position.y -= dy * force;
        } 
        
        // 3. Return to center logic (gentle pull back so they don't fly away)
        mesh.position.x += (mesh.userData.initialX - mesh.position.x) * 0.01;
        mesh.position.y += (mesh.userData.initialY - mesh.position.y) * 0.01;
    });

    // Slight camera movement based on mouse
    camera.position.x += (mouseX * 0.005 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.005 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});