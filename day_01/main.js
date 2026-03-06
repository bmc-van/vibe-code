import * as THREE from 'three';

class WorldBuilderSimulation {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1500);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        
        this.mouse = new THREE.Vector3(-500, 0, -500); 
        this.targetMouse = new THREE.Vector3(0, 0, 0);
        this.gridSize = 100; // Expanded to 10,000 blocks
        this.cells = [];
        
        this.colors = {
            base: new THREE.Color(0x0a0a0a),
            accent: new THREE.Color(0xc5a059),
            bg: new THREE.Color(0x0d0d0d)
        };
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Move camera back to view the larger surface
        this.camera.position.set(0, 100, 140);
        this.camera.lookAt(0, 0, 0);

        // Expand fog for the new dimensions
        this.scene.fog = new THREE.Fog(0x0d0d0d, 80, 280);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(ambientLight);

        this.spotLight = new THREE.SpotLight(0xc5a059, 10);
        this.spotLight.position.set(0, 80, 0);
        this.spotLight.angle = 0.5;
        this.spotLight.penumbra = 1;
        this.spotLight.decay = 2;
        this.spotLight.distance = 300;
        this.scene.add(this.spotLight);

        this.gridGroup = new THREE.Group();
        this.scene.add(this.gridGroup);

        // Create Expanded Grid
        const spacing = 3.2; // Increased spacing for larger footprint
        const totalSize = (this.gridSize - 1) * spacing;
        const offset = totalSize / 2;

        const geometry = new THREE.BoxGeometry(2.8, 1, 2.8);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.colors.base,
            roughness: 0.25,
            metalness: 0.1
        });

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const mesh = new THREE.Mesh(geometry, material.clone());
                mesh.position.set(
                    i * spacing - offset,
                    0,
                    j * spacing - offset
                );
                this.gridGroup.add(mesh);
                this.cells.push({
                    mesh: mesh,
                    targetY: 0,
                    worldPos: new THREE.Vector3()
                });
            }
        }

        this.raycaster = new THREE.Raycaster();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('resize', () => this.onWindowResize());

        this.animate();
        this.initScrollReveal();
    }

    onMouseMove(event) {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera({ x, y }, this.camera);
        this.raycaster.ray.intersectPlane(this.plane, this.targetMouse);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        // Consistent rotation
        this.gridGroup.rotation.y += 0.001;

        // Smooth follow
        this.mouse.lerp(this.targetMouse, 0.08);
        this.spotLight.position.set(this.mouse.x, 80, this.mouse.z);
        this.spotLight.target.position.set(this.mouse.x, 0, this.mouse.z);
        this.spotLight.target.updateMatrixWorld();

        this.cells.forEach(cell => {
            cell.mesh.getWorldPosition(cell.worldPos);
            
            const dx = cell.worldPos.x - this.mouse.x;
            const dz = cell.worldPos.z - this.mouse.z;
            const distSq = dx*dx + dz*dz; // Optimized distance check
            
            const radius = 35;
            const radiusSq = radius * radius;
            
            if (distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                const strength = 1 - (dist / radius);
                cell.targetY = Math.pow(strength, 2.5) * 22;
                cell.mesh.material.color.lerpColors(this.colors.base, this.colors.accent, strength * 0.95);
            } else {
                cell.targetY = 0;
                if (!cell.mesh.material.color.equals(this.colors.base)) {
                    cell.mesh.material.color.lerp(this.colors.base, 0.1);
                }
            }

            // High-fidelity animation
            cell.mesh.position.y += (cell.targetY - cell.mesh.position.y) * 0.1;
            
            // Subtle wave undercurrent
            const wave = Math.sin(cell.mesh.position.x * 0.06 + cell.mesh.position.z * 0.06 + time * 0.3) * 0.4;
            cell.mesh.position.y += wave;
            
            // Dynamic scale
            cell.mesh.scale.y = 1 + cell.mesh.position.y * 0.25;
        });

        this.renderer.render(this.scene, this.camera);
    }

    initScrollReveal() {
        const header = document.querySelector('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        const sections = document.querySelectorAll('.content-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const rect = entry.target.getBoundingClientRect();
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    entry.target.classList.remove('off-screen-top');
                } else {
                    entry.target.classList.remove('revealed');
                    if (rect.top < 0) entry.target.classList.add('off-screen-top');
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => observer.observe(section));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WorldBuilderSimulation();
});
