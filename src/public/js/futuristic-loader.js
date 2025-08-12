/**
 * Futuristic Loader - YouTube Subscription Panel
 * Created by NinjaTech AI - 2025
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create loader elements
  createLoaderElements();
  
  // Show loader on page load
  showLoaderOnPageLoad();
  
  // Show loader on AJAX requests
  setupAjaxLoader();
  
  // Show loader on link clicks
  setupLinkTransitions();
  
  // Show loader on form submissions
  setupFormSubmissions();
});

// Create loader elements
function createLoaderElements() {
  // Create loader container
  const loaderContainer = document.createElement('div');
  loaderContainer.className = 'futuristic-loader-container';
  
  // Create loader
  const loader = document.createElement('div');
  loader.className = 'futuristic-loader';
  
  // Create spinner
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  // Create pulse
  const pulse = document.createElement('div');
  pulse.className = 'pulse';
  
  // Create text
  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = 'LOADING';
  
  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  
  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  
  // Append elements
  progressContainer.appendChild(progressBar);
  loader.appendChild(spinner);
  loader.appendChild(pulse);
  loader.appendChild(text);
  loader.appendChild(progressContainer);
  loaderContainer.appendChild(loader);
  
  // Create page transition element
  const pageTransition = document.createElement('div');
  pageTransition.className = 'page-transition';
  
  // Create scan line
  const scanLine = document.createElement('div');
  scanLine.className = 'scan-line';
  
  // Append to body
  document.body.appendChild(loaderContainer);
  document.body.appendChild(pageTransition);
  document.body.appendChild(scanLine);
}

// Show loader on page load
function showLoaderOnPageLoad() {
  const loaderContainer = document.querySelector('.futuristic-loader-container');
  const scanLine = document.querySelector('.scan-line');
  
  // Show loader
  loaderContainer.classList.add('active');
  
  // Hide loader after page loads
  window.addEventListener('load', function() {
    setTimeout(function() {
      loaderContainer.classList.remove('active');
      
      // Show scan line
      scanLine.classList.add('active');
      
      // Hide scan line after animation
      setTimeout(function() {
        scanLine.classList.remove('active');
      }, 2000);
    }, 500);
  });
}

// Show loader on AJAX requests
function setupAjaxLoader() {
  const loaderContainer = document.querySelector('.futuristic-loader-container');
  
  // Track AJAX requests
  let activeRequests = 0;
  
  // Override fetch
  const originalFetch = window.fetch;
  window.fetch = function() {
    activeRequests++;
    updateLoaderVisibility();
    
    return originalFetch.apply(this, arguments)
      .then(function(response) {
        activeRequests--;
        updateLoaderVisibility();
        return response;
      })
      .catch(function(error) {
        activeRequests--;
        updateLoaderVisibility();
        throw error;
      });
  };
  
  // Override XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('loadstart', function() {
      activeRequests++;
      updateLoaderVisibility();
    });
    
    this.addEventListener('loadend', function() {
      activeRequests--;
      updateLoaderVisibility();
    });
    
    originalXHROpen.apply(this, arguments);
  };
  
  // Update loader visibility
  function updateLoaderVisibility() {
    if (activeRequests > 0) {
      loaderContainer.classList.add('active');
      
      // Update loader text
      const loaderText = loaderContainer.querySelector('.text');
      if (loaderText) {
        loaderText.textContent = `LOADING (${activeRequests})`;
      }
    } else {
      loaderContainer.classList.remove('active');
    }
  }
}

// Show loader on link clicks
function setupLinkTransitions() {
  const loaderContainer = document.querySelector('.futuristic-loader-container');
  const pageTransition = document.querySelector('.page-transition');
  const scanLine = document.querySelector('.scan-line');
  
  // Get all links that lead to other pages
  const links = document.querySelectorAll('a');
  
  links.forEach(function(link) {
    // Skip links that open in new tabs or are anchors
    if (link.target === '_blank' || link.getAttribute('href') === '#' || link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
      return;
    }
    
    // Skip links with data-no-transition attribute
    if (link.hasAttribute('data-no-transition')) {
      return;
    }
    
    link.addEventListener('click', function(event) {
      // Skip if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      
      const href = link.getAttribute('href');
      
      // Skip AJAX requests and JavaScript links
      if (!href || href.startsWith('javascript:') || href.includes('ajax=true')) {
        return;
      }
      
      // Prevent default navigation
      event.preventDefault();
      
      // Show scan line
      scanLine.classList.add('active');
      
      // Show page transition
      setTimeout(function() {
        pageTransition.classList.add('active');
        
        // Show loader
        setTimeout(function() {
          loaderContainer.classList.add('active');
          
          // Navigate to the new page
          setTimeout(function() {
            window.location.href = href;
          }, 300);
        }, 300);
      }, 100);
    });
  });
}

// Show loader on form submissions
function setupFormSubmissions() {
  const loaderContainer = document.querySelector('.futuristic-loader-container');
  const scanLine = document.querySelector('.scan-line');
  
  // Get all forms
  const forms = document.querySelectorAll('form');
  
  forms.forEach(function(form) {
    // Skip forms with data-no-loader attribute
    if (form.hasAttribute('data-no-loader')) {
      return;
    }
    
    form.addEventListener('submit', function() {
      // Show scan line
      scanLine.classList.add('active');
      
      // Show loader
      setTimeout(function() {
        loaderContainer.classList.add('active');
        
        // Update loader text
        const loaderText = loaderContainer.querySelector('.text');
        if (loaderText) {
          loaderText.textContent = 'PROCESSING';
        }
      }, 100);
    });
  });
}