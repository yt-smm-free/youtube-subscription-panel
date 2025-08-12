/**
 * Modern Dark Theme - YouTube Subscription Panel
 * Simple animations and transitions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add smooth fade-in effect to page content
  fadeInContent();
  
  // Add subtle hover effects to cards
  enhanceCardHovers();
  
  // Add smooth transitions to buttons
  enhanceButtonEffects();
  
  // Add subtle animation to progress bars
  animateProgressBars();
  
  // Add smooth scrolling to anchor links
  setupSmoothScrolling();
});

// Fade in content on page load
function fadeInContent() {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.style.opacity = '0';
    mainContent.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      mainContent.style.opacity = '1';
    }, 100);
  }
}

// Enhance card hover effects
function enhanceCardHovers() {
  const cards = document.querySelectorAll('.feature, .stat-card, .quick-action-card, .campaign-channel');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    });
  });
}

// Enhance button effects
function enhanceButtonEffects() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.98)';
    });
    
    button.addEventListener('mouseup', function() {
      this.style.transform = 'scale(1)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
}

// Animate progress bars
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-fill');
  
  progressBars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0';
    
    setTimeout(() => {
      bar.style.width = width;
    }, 300);
  });
}

// Setup smooth scrolling for anchor links
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Add simple loading indicator for AJAX requests
(function() {
  // Create loading indicator element
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="loading-spinner"></div>
  `;
  document.body.appendChild(loadingIndicator);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .loading-indicator {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: transparent;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .loading-indicator.active {
      opacity: 1;
    }
    
    .loading-spinner {
      height: 100%;
      width: 0;
      background-color: var(--primary-color);
      transition: width 0.3s ease;
    }
    
    .loading-indicator.active .loading-spinner {
      width: 100%;
      animation: loading 2s ease infinite;
    }
    
    @keyframes loading {
      0% { width: 0; }
      50% { width: 70%; }
      100% { width: 100%; }
    }
  `;
  document.head.appendChild(style);
  
  // Track AJAX requests
  let activeRequests = 0;
  
  // Override fetch
  const originalFetch = window.fetch;
  window.fetch = function() {
    activeRequests++;
    updateLoadingIndicator();
    
    return originalFetch.apply(this, arguments)
      .then(function(response) {
        activeRequests--;
        updateLoadingIndicator();
        return response;
      })
      .catch(function(error) {
        activeRequests--;
        updateLoadingIndicator();
        throw error;
      });
  };
  
  // Override XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('loadstart', function() {
      activeRequests++;
      updateLoadingIndicator();
    });
    
    this.addEventListener('loadend', function() {
      activeRequests--;
      updateLoadingIndicator();
    });
    
    originalXHROpen.apply(this, arguments);
  };
  
  // Update loading indicator
  function updateLoadingIndicator() {
    if (activeRequests > 0) {
      loadingIndicator.classList.add('active');
    } else {
      loadingIndicator.classList.remove('active');
    }
  }
})();