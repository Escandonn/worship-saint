export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  opacity: number;

  constructor(x: number, y: number, pointerSpeed: number) {
    // Distribuimos aleatoriamente las partículas alrededor del área rascada
    this.x = x + (Math.random() - 0.5) * 40; 
    this.y = y + (Math.random() - 0.5) * 40;
    
    // Velocidad base sumada a la inercia (velocidad del puntero)
    const baseSpeed = Math.random() * 2 + 1;
    const influencedSpeed = baseSpeed + (pointerSpeed * 0.15);
    
    // Ángulo de explosión (hacia afuera)
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * influencedSpeed;
    this.vy = Math.sin(angle) * influencedSpeed - 2; // Ligero impulso hacia arriba al nacer
    
    // Vida aleatoria entre 400ms y 700ms
    this.maxLife = Math.random() * 300 + 400; 
    this.life = this.maxLife;
    this.size = Math.random() * 2.5 + 1; // Tamaños variados
    this.gravity = 0.08; // Gravedad suave cayendo
    
    // Colores temáticos: Iron Man (Rojo, Dorado) y Doctor Doom (Verde Oscuro, Plata)
    const colors = [
      '#E63946', // Rojo Iron Man
      '#FFD700', // Dorado Iron Man
      '#2E8B57', // Verde Doom
      '#C0C0C0', // Plata Doom
      'rgba(255, 255, 255, 0.7)' // Polvo blanco genérico
    ];
    
    this.color = colors[Math.floor(Math.random() * colors.length)];
      
    this.opacity = 1;
  }

  update(deltaTime: number) {
    this.life -= deltaTime;
    this.vy += this.gravity; // Aplicar gravedad
    
    // Fricción suave en el aire
    this.vx *= 0.95;
    this.vy *= 0.98;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Fade out a medida que muere
    this.opacity = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Resetear para no afectar otros dibujos
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(x: number, y: number, speed: number, count: number = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, speed));
    }
  }

  updateAndDraw(ctx: CanvasRenderingContext2D, deltaTime: number) {
    // No redibujar si no hay partículas (ahorra CPU/GPU en idle)
    if (this.particles.length === 0) return;

    // Limpiar usando dimensiones CSS (no backing store) — más eficiente
    const cssW = ctx.canvas.clientWidth;
    const cssH = ctx.canvas.clientHeight;
    ctx.clearRect(0, 0, cssW || ctx.canvas.width, cssH || ctx.canvas.height);
    
    ctx.globalCompositeOperation = 'source-over'; 

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(deltaTime);
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }
  }
}
