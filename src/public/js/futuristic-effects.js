/**
 * Futuristic UI Effects - YouTube Subscription Panel
 * Created by NinjaTech AI - 2025
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add floating animation to specific elements
  const floatingElements = document.querySelectorAll('.feature-icon, .stat-icon, .quick-action-icon');
  floatingElements.forEach(element => {
    element.classList.add('floating');
  });
  
  // Add pulse animation to specific elements
  const pulseElements = document.querySelectorAll('.btn-primary, .channel-thumbnail-large');
  pulseElements.forEach(element => {
    element.classList.add('pulse');
  });
  
  // Create particle background effect for hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    createParticleBackground(heroSection);
  }
  
  // Add hover effect to table rows
  const tableRows = document.querySelectorAll('.data-table tbody tr');
  tableRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
      this.style.transform = 'translateX(5px)';
      this.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    row.addEventListener('mouseleave', function() {
      this.style.transform = 'translateX(0)';
    });
  });
  
  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add typing animation to terminal responses
  animateTerminalText();
  
  // Add scroll reveal animations
  initScrollReveal();
});

// Function to create particle background
function createParticleBackground(container) {
  const canvas = document.createElement('canvas');
  canvas.classList.add('particle-canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.opacity = '0.5';
  container.style.position = 'relative';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  
  function resizeCanvas() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
  
  function createParticles() {
    particles = [];
    const particleCount = Math.floor(canvas.width / 20); // Adjust density
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        color: '#00e5ff',
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25
      });
    }
  }
  
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
    });
    
    // Draw connections between nearby particles
    particles.forEach((particle, i) => {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particle.x - particles[j].x;
        const dy = particle.y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.2 * (1 - distance / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(drawParticles);
  }
  
  // Initialize
  window.addEventListener('resize', function() {
    resizeCanvas();
    createParticles();
  });
  
  resizeCanvas();
  createParticles();
  drawParticles();
}

// Function to animate terminal text
function animateTerminalText() {
  const terminalBodies = document.querySelectorAll('.terminal-body, .terminal-mini .terminal-body');
  
  terminalBodies.forEach(terminal => {
    const responseElements = terminal.querySelectorAll('.response:not(.animated)');
    
    responseElements.forEach((element, index) => {
      const text = element.textContent;
      element.textContent = '';
      element.classList.add('animated');
      
      // Delay each element's animation
      setTimeout(() => {
        let charIndex = 0;
        const typingInterval = setInterval(() => {
          if (charIndex < text.length) {
            element.textContent += text.charAt(charIndex);
            charIndex++;
          } else {
            clearInterval(typingInterval);
          }
        }, 20);
      }, index * 200);
    });
  });
}

// Function to initialize scroll reveal animations
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.feature, .stat-card, .quick-action-card, .terminal, .terminal-table');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  revealElements.forEach(element => {
    // Add initial styles
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    
    // Add revealed class styles
    const style = document.createElement('style');
    style.innerHTML = `
      .revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    `;
    document.head.appendChild(style);
    
    // Observe element
    observer.observe(element);
  });
}

// Add CSS for ripple effect
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.innerHTML = `
    .btn {
      position: relative;
      overflow: hidden;
    }
    
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.4);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
});