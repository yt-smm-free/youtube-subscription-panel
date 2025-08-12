/**
 * YouTube Subscription Panel - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Terminal typing animation for cursor
    const cursors = document.querySelectorAll('.cursor');
    cursors.forEach(cursor => {
        setInterval(() => {
            cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
        }, 500);
    });

    // Modal functionality
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Close modal when clicking on close button
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('[data-copy]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy');
            const tempInput = document.createElement('input');
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // Show copied message
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            setTimeout(() => {
                this.textContent = originalText;
            }, 2000);
        });
    });
    
    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    // Add error message if it doesn't exist
                    let errorMessage = field.nextElementSibling;
                    if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                        errorMessage = document.createElement('p');
                        errorMessage.classList.add('error-message');
                        errorMessage.textContent = 'This field is required';
                        field.parentNode.insertBefore(errorMessage, field.nextSibling);
                    }
                } else {
                    field.classList.remove('error');
                    
                    // Remove error message if it exists
                    const errorMessage = field.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('error-message')) {
                        errorMessage.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });
    
    // YouTube channel URL validation
    const channelUrlInputs = document.querySelectorAll('input[name="channelUrl"]');
    channelUrlInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const url = this.value.trim();
            
            if (url && !url.includes('/channel/')) {
                this.classList.add('error');
                
                // Add error message if it doesn't exist
                let errorMessage = this.nextElementSibling;
                if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                    errorMessage = document.createElement('p');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = 'Please use a channel URL in the format: https://www.youtube.com/channel/CHANNEL_ID';
                    this.parentNode.insertBefore(errorMessage, this.nextSibling);
                }
            } else {
                this.classList.remove('error');
                
                // Remove error message if it exists
                const errorMessage = this.nextElementSibling;
                if (errorMessage && errorMessage.classList.contains('error-message')) {
                    errorMessage.remove();
                }
            }
        });
    });
    
    // Table filtering
    const searchInputs = document.querySelectorAll('.search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const tableId = this.getAttribute('data-table') || this.closest('.terminal-table').querySelector('table').id;
            const table = document.getElementById(tableId);
            
            if (table) {
                filterTable(table);
            }
        });
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get all filter buttons in the same group
            const filterGroup = this.closest('.filter-buttons');
            if (filterGroup) {
                const buttons = filterGroup.querySelectorAll('.filter-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
            }
            
            this.classList.add('active');
            
            const tableId = this.getAttribute('data-table') || this.closest('.terminal-table').querySelector('table').id;
            const table = document.getElementById(tableId);
            
            if (table) {
                filterTable(table);
            }
        });
    });
    
    function filterTable(table) {
        const tableContainer = table.closest('.terminal-table');
        if (!tableContainer) return;
        
        const searchInput = tableContainer.querySelector('.search-input');
        const activeFilter = tableContainer.querySelector('.filter-btn.active');
        
        if (!searchInput || !activeFilter) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = activeFilter.getAttribute('data-filter');
        
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matchesSearch = text.includes(searchTerm);
            
            let matchesFilter = true;
            if (filterValue !== 'all') {
                matchesFilter = row.classList.contains(filterValue) || row.classList.contains('status-' + filterValue);
            }
            
            row.style.display = matchesSearch && matchesFilter ? '' : 'none';
        });
    }
    
    // Execute campaign functionality
    const executeCampaignButtons = document.querySelectorAll('.execute-campaign, #execute-campaign');
    executeCampaignButtons.forEach(button => {
        button.addEventListener('click', function() {
            const campaignId = this.getAttribute('data-id');
            
            if (!campaignId) return;
            
            if (confirm('Are you sure you want to execute this campaign? This will subscribe all authorized users to the channel.')) {
                // Disable button and show loading
                this.disabled = true;
                this.textContent = 'Processing...';
                
                fetch(`/abc/xxx/campaigns/${campaignId}/execute`, {
                    method: 'POST'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(`Campaign executed successfully: ${data.successCount} successful subscriptions, ${data.failCount} failed`);
                            location.reload();
                        } else {
                            alert('Failed to execute campaign: ' + data.message);
                            this.disabled = false;
                            this.textContent = 'Execute Campaign';
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while executing the campaign');
                        this.disabled = false;
                        this.textContent = 'Execute Campaign';
                    });
            }
        });
    });
    
    // Generate login link functionality
    const generateLinkButtons = document.querySelectorAll('#generate-link');
    generateLinkButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const modal = document.getElementById('link-modal');
            const loginLinkDisplay = document.getElementById('login-link-display');
            
            if (!modal || !loginLinkDisplay) return;
            
            fetch('/auth/generate-link')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        loginLinkDisplay.textContent = data.loginLink;
                        modal.style.display = 'block';
                    } else {
                        alert('Failed to generate login link: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while generating the login link');
                });
        });
    });
    
    // Copy link functionality
    const copyLinkButtons = document.querySelectorAll('#copy-link');
    copyLinkButtons.forEach(button => {
        button.addEventListener('click', function() {
            const loginLinkDisplay = document.getElementById('login-link-display');
            
            if (!loginLinkDisplay) return;
            
            const tempInput = document.createElement('input');
            tempInput.value = loginLinkDisplay.textContent;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            this.textContent = 'Copied!';
            setTimeout(() => {
                this.textContent = 'Copy Link';
            }, 2000);
        });
    });
    
    // View user details functionality
    const viewUserButtons = document.querySelectorAll('.view-user');
    viewUserButtons.forEach(button => {
        button.addEventListener('click', function() {
            const loginId = this.getAttribute('data-id');
            const userModal = document.getElementById('user-modal');
            const userDetailsContent = document.getElementById('user-details-content');
            
            if (!loginId || !userModal || !userDetailsContent) return;
            
            // Clear previous content and show loading
            userDetailsContent.innerHTML = `
                <div class="line">$ <span class="command">loading_user_data</span></div>
                <div class="line">$ <span class="response">Please wait...</span></div>
            `;
            
            userModal.style.display = 'block';
            
            // Fetch user data
            fetch(`/user/profile/${loginId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const profile = data.profile;
                        
                        // Fetch subscription history
                        return fetch(`/user/subscriptions/${loginId}`)
                            .then(response => response.json())
                            .then(subData => {
                                if (subData.success) {
                                    return {
                                        profile: profile,
                                        subscriptions: subData.subscriptions
                                    };
                                } else {
                                    throw new Error(subData.message);
                                }
                            });
                    } else {
                        throw new Error(data.message);
                    }
                })
                .then(userData => {
                    // Display user data
                    let content = `
                        <div class="line">$ <span class="command">user_profile</span></div>
                        <div class="line">$ <span class="response">Login ID: ${loginId}</span></div>
                        <div class="line">$ <span class="response">Name: ${userData.profile.name || 'Not Authorized'}</span></div>
                        <div class="line">$ <span class="response">Status: ${userData.profile.isAuthorized ? 'Authorized' : 'Pending'}</span></div>
                    `;
                    
                    if (userData.profile.isAuthorized) {
                        content += `
                            <div class="line">$ <span class="command">subscription_history</span></div>
                        `;
                        
                        if (userData.subscriptions && userData.subscriptions.length > 0) {
                            userData.subscriptions.forEach((sub, index) => {
                                content += `
                                    <div class="line">$ <span class="response">${index + 1}. ${sub.channelName} - ${sub.success ? 'Success' : 'Failed'} - ${new Date(sub.subscribedAt).toLocaleString()}</span></div>
                                `;
                            });
                        } else {
                            content += `
                                <div class="line">$ <span class="response">No subscription history found</span></div>
                            `;
                        }
                    }
                    
                    userDetailsContent.innerHTML = content;
                })
                .catch(error => {
                    console.error('Error:', error);
                    userDetailsContent.innerHTML = `
                        <div class="line">$ <span class="command">error</span></div>
                        <div class="line">$ <span class="response error-text">Failed to load user data: ${error.message}</span></div>
                    `;
                });
        });
    });
    
    // Revoke authorization functionality
    const revokeAuthButtons = document.querySelectorAll('.revoke-auth');
    revokeAuthButtons.forEach(button => {
        button.addEventListener('click', function() {
            const loginId = this.getAttribute('data-id');
            
            if (!loginId) return;
            
            if (confirm('Are you sure you want to revoke this user\'s authorization? They will need to re-authorize to participate in campaigns.')) {
                fetch(`/user/revoke/${loginId}`, {
                    method: 'POST'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Authorization revoked successfully');
                            location.reload();
                        } else {
                            alert('Failed to revoke authorization: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while revoking authorization');
                    });
            }
        });
    });
});