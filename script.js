// Global variable to store preloaded assets
const mediaCache = {};
const mediaPreview = document.getElementById('media-preview');
const mediaLinks = document.querySelectorAll('.nav-link');

// --- NEW PRE-LOAD FUNCTION ---
function preloadMedia(link) {
    const src = link.dataset.src;
    const type = link.dataset.type;
    const placeholder = link.dataset.placeholder;

    if (mediaCache[src]) {
        return; // Already preloaded or loading
    }

    if (type === 'video') {
        mediaCache[src] = { element: null, status: 'loading' };

        // 1. Create and start loading the video element
        const video = document.createElement('video');
        video.src = src;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto'; // Important for pre-loading

        // 2. Add loading listeners
        video.addEventListener('canplaythrough', () => {
            mediaCache[src].status = 'loaded';
            // Store the loaded element
            mediaCache[src].element = video; 
            console.log(`Video loaded successfully: ${src}`);
        });

        // 3. Add error listener
        video.addEventListener('error', () => {
            mediaCache[src].status = 'error';
            console.error(`Error loading video: ${src}`);
        });
        
        // Start load
        video.load();

    } else if (type === 'image') {
        // Standard image loading remains quick
        const img = new Image();
        img.src = src;
        mediaCache[src] = { element: img, status: 'loaded' };
    }
}

// --- NEW SHOW/HIDE LOGIC ---
mediaLinks.forEach(link => {
    // Start preloading videos immediately after the DOM loads
    if (link.dataset.type === 'video') {
        preloadMedia(link);
    }
    
    link.addEventListener('mouseenter', () => {
        const src = link.dataset.src;
        const type = link.dataset.type;
        const placeholder = link.dataset.placeholder;

        if (type === 'video') {
            const cachedMedia = mediaCache[src];
            
            if (cachedMedia && cachedMedia.status === 'loaded') {
                // If video is loaded, play it
                mediaPreview.innerHTML = '';
                mediaPreview.appendChild(cachedMedia.element);
                mediaPreview.classList.add('active');
                cachedMedia.element.play().catch(e => console.log('Video play failed:', e));

            } else {
                // If video is still loading, show a quick placeholder image
                mediaPreview.innerHTML = `<img src="${placeholder}" alt="Loading Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
                mediaPreview.classList.add('active');
            }

        } else if (type === 'image') {
            // Existing image logic (which is fast)
            const img = mediaCache[src] ? mediaCache[src].element : new Image();
            if (!mediaCache[src]) {
                 img.src = src;
                 mediaCache[src] = { element: img, status: 'loaded' };
            }
            mediaPreview.innerHTML = '';
            mediaPreview.appendChild(img);
            mediaPreview.classList.add('active');
        }
    });

    link.addEventListener('mouseleave', () => {
        mediaPreview.classList.remove('active');
        // Stop the video element when hiding
        const cachedMedia = mediaCache[link.dataset.src];
        if (cachedMedia && cachedMedia.status === 'loaded' && cachedMedia.element.tagName === 'VIDEO') {
            cachedMedia.element.pause();
        }
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