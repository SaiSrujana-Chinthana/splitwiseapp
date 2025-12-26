// ============ GENERATE UNIQUE USER ID ============

function generateUserId() {
    return 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// ============ AUTHENTICATION ============

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    const currentPath = window.location.pathname;
    
    if (!user && currentPath.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
    
    if (user && currentPath.includes('dashboard.html')) {
        displayUserProfile();
    }
}

// Switch tabs
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginTabBtn');
    const registerBtn = document.getElementById('registerTabBtn');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
    }
}

// ============ EMAIL/PASSWORD LOGIN ============

function doLogin() {
    console.log('Login clicked');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    console.log('Email:', email);
    console.log('Password:', password);

    if (!email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } else {
        showMessage('Invalid email or password!', 'error');
    }
}

// ============ EMAIL/PASSWORD REGISTER ============

function doRegister() {
    console.log('Register clicked');
    
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    
    console.log('Email:', email);
    console.log('Password:', password);

    if (!email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.find(u => u.email === email)) {
        showMessage('User already exists! Please login.', 'error');
        return;
    }

    const newUser = { 
        email: email, 
        password: password,
        authProvider: 'email',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    showMessage('Registration successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
}

// ============ GOOGLE LOGIN ============

function handleGoogleLogin(response) {
    console.log('Google login response:', response);
    
    // Decode JWT token
    const userData = parseJWT(response.credential);
    console.log('User data:', userData);
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let existingUser = users.find(u => u.email === userData.email);
    
    if (existingUser) {
        // Update existing user with Google info
        existingUser.name = userData.name;
        existingUser.picture = userData.picture;
        existingUser.authProvider = 'google';
        existingUser.googleId = userData.sub;
        
        users = users.map(u => u.email === existingUser.email ? existingUser : u);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(existingUser));
    } else {
        // Create new Google user
        const googleUser = {
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            authProvider: 'google',
            googleId: userData.sub,
            createdAt: new Date().toISOString()
        };
        
        users.push(googleUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(googleUser));
    }
    
    showMessage('Google login successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
}

// Parse JWT token
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// ============ LOGOUT ============

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ============ USER PROFILE WITH UNIQUE ID ============

function displayUserProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const profileDiv = document.getElementById('userProfile');
    
    if (!profileDiv || !currentUser) return;
    
    // Generate userId if not exists
    if (!currentUser.userId) {
        currentUser.userId = generateUserId();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Also update in users array
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].userId = currentUser.userId;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    if (currentUser.picture) {
        // Google user with picture
        profileDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${currentUser.picture}" alt="Profile" 
                     style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid white;">
                <div>
                    <div style="font-weight: bold; color: white;">${currentUser.name || currentUser.email}</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.7);">
                        🆔 ${currentUser.userId}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Email user
        profileDiv.innerHTML = `
            <div style="color: white;">
                <div style="font-weight: bold;">👤 ${currentUser.email}</div>
                <div style="font-size: 11px; opacity: 0.8;">🆔 ${currentUser.userId}</div>
            </div>
        `;
    }
}

// ============ DASHBOARD SECTIONS ============

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.style.display = 'none');
    
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    const buttons = document.querySelectorAll('.menu-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Load data based on section
    if (sectionId === 'addMember') {
        loadGroupDropdown();
    }
    
    if (sectionId === 'createSplit') {
        loadGroupDropdownForSplits();
        loadSplitsHistory();
    }
}

// ============ GROUP MANAGEMENT ============

function createNewGroup() {
    const name = document.getElementById('groupName').value.trim();
    const desc = document.getElementById('description').value.trim();
    const emails = document.getElementById('memberEmails').value.trim();

    if (!name) {
        showMessage('Please enter group name', 'error');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showMessage('Please login first', 'error');
        window.location.href = 'index.html';
        return;
    }

    let groups = JSON.parse(localStorage.getItem('groups')) || [];

    const newGroup = {
        id: Date.now(),
        name: name,
        description: desc || 'No description',
        createdBy: currentUser.email,
        members: [{ email: currentUser.email, role: 'creator' }],
        createdAt: new Date().toISOString()
    };

    if (emails) {
        const emailList = emails.split(',');
        let addedCount = 0;
        
        emailList.forEach(email => {
            const trimmedEmail = email.trim();
            if (trimmedEmail && trimmedEmail !== currentUser.email && isValidEmail(trimmedEmail)) {
                newGroup.members.push({ email: trimmedEmail, role: 'member' });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            showMessage(`Group created with ${addedCount + 1} members!`, 'success');
        } else {
            showMessage('Group created! (Invalid emails were skipped)', 'success');
        }
    } else {
        showMessage('Group created successfully!', 'success');
    }

    groups.push(newGroup);
    localStorage.setItem('groups', JSON.stringify(groups));
    
    document.getElementById('groupName').value = '';
    document.getElementById('description').value = '';
    document.getElementById('memberEmails').value = '';
    
    loadGroups();
    loadGroupDropdown();
}

function addMemberToGroup() {
    const groupId = parseInt(document.getElementById('selectGroup').value);
    const email = document.getElementById('memberEmail').value.trim();

    if (!groupId) {
        showMessage('Please select a group', 'error');
        return;
    }

    if (!email) {
        showMessage('Please enter member email', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    let groups = JSON.parse(localStorage.getItem('groups')) || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
        showMessage('Group not found', 'error');
        return;
    }

    const group = groups[groupIndex];

    if (group.members.some(m => m.email === email)) {
        showMessage('Member already exists in this group!', 'error');
        return;
    }

    group.members.push({ email: email, role: 'member' });
    groups[groupIndex] = group;
    localStorage.setItem('groups', JSON.stringify(groups));

    showMessage(`✅ ${email} added successfully!`, 'success');
    document.getElementById('memberEmail').value = '';
    
    loadGroups();
    showCurrentGroupMembers(groupId);
}

function showCurrentGroupMembers(groupId) {
    if (!groupId) {
        const container = document.getElementById('currentGroupMembers');
        if (container) container.style.display = 'none';
        return;
    }

    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const group = groups.find(g => g.id === groupId);

    if (!group) return;

    const membersDiv = document.getElementById('membersList');
    const container = document.getElementById('currentGroupMembers');

    if (!membersDiv || !container) return;

    membersDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
            <strong style="color: #667eea;">Group: ${group.name}</strong>
            <ul style="list-style: none; padding: 0; margin-top: 10px;">
                ${group.members.map(m => `
                    <li style="padding: 10px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
                        <span>${m.role === 'creator' ? '👑' : '👤'} ${m.email}</span>
                        <span style="font-size: 12px; color: #666;">${m.role.toUpperCase()}</span>
                    </li>
                `).join('')}
            </ul>
            <div style="margin-top: 10px; font-size: 14px; color: #666;">
                Total Members: ${group.members.length}
            </div>
        </div>
    `;

    container.style.display = 'block';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function loadGroups() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const userGroups = groups.filter(g => 
        g.members.some(m => m.email === currentUser.email)
    );

    const list = document.getElementById('groupsList');
    if (!list) return;
    
    if (userGroups.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 60px;">
                <h3 style="font-size: 2rem; margin-bottom: 15px;">📭 No groups yet!</h3>
                <p style="font-size: 1.2rem;">Create your first group to get started.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = userGroups.map(g => `
        <div class="group-card">
            <h3>${g.name}</h3>
            <p>${g.description}</p>
            <div class="group-members">
                <strong>Members (${g.members.length})</strong>
                <ul>
                    ${g.members.map(m => `
                        <li>
                            ${m.role === 'creator' ? '👑' : '📧'} ${m.email}
                            ${m.role === 'creator' ? '<span style="font-size: 11px; color: #667eea; font-weight: bold;"> (Creator)</span>' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div style="font-size: 13px; color: #999; margin-top: 15px;">
                Created: ${new Date(g.createdAt).toLocaleDateString()}
            </div>
            ${g.createdBy === currentUser.email ? 
                `<button onclick="deleteGroup(${g.id})" class="btn-danger">Delete Group</button>` : ''}
        </div>
    `).join('');
}

function loadGroupDropdown() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const userGroups = groups.filter(g => 
        g.members.some(m => m.email === currentUser.email)
    );

    const select = document.getElementById('selectGroup');
    if (!select) return;
    
    if (userGroups.length === 0) {
        select.innerHTML = '<option value="">No groups available</option>';
    } else {
        select.innerHTML = '<option value="">Choose a group...</option>' +
            userGroups.map(g => `<option value="${g.id}">${g.name} (${g.members.length} members)</option>`).join('');
    }
}

function deleteGroup(id) {
    if (!confirm('Are you sure you want to delete this group?')) return;

    let groups = JSON.parse(localStorage.getItem('groups')) || [];
    groups = groups.filter(g => g.id !== id);
    localStorage.setItem('groups', JSON.stringify(groups));

    showMessage('Group deleted successfully!', 'success');
    loadGroups();
    loadGroupDropdown();
}

// ============ EXPENSE SPLITTING ============

// Load group members for split
function loadGroupMembersForSplit() {
    const groupId = parseInt(document.getElementById('splitGroup').value);
    
    if (!groupId) {
        document.getElementById('memberCheckboxes').innerHTML = '<p style="color: #999;">Select a group first</p>';
        document.getElementById('paidBy').innerHTML = '<option value="">Who paid?</option>';
        return;
    }
    
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return;
    
    // Populate "Paid By" dropdown
    const paidBySelect = document.getElementById('paidBy');
    paidBySelect.innerHTML = '<option value="">Who paid?</option>' + 
        group.members.map(m => `<option value="${m.email}">${m.email}</option>`).join('');
    
    // Populate member checkboxes
    const checkboxDiv = document.getElementById('memberCheckboxes');
    checkboxDiv.innerHTML = group.members.map(m => `
        <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" value="${m.email}" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                <span>${m.role === 'creator' ? '👑' : '👤'} ${m.email}</span>
            </label>
        </div>
    `).join('');
}

// Create split
function createSplit() {
    const groupId = parseInt(document.getElementById('splitGroup').value);
    const description = document.getElementById('splitDescription').value.trim();
    const amount = parseFloat(document.getElementById('splitAmount').value);
    const paidBy = document.getElementById('paidBy').value;
    
    // Get selected members
    const checkboxes = document.querySelectorAll('#memberCheckboxes input[type="checkbox"]:checked');
    const splitBetween = Array.from(checkboxes).map(cb => cb.value);
    
    // Validation
    if (!groupId) {
        showMessage('Please select a group', 'error');
        return;
    }
    
    if (!description) {
        showMessage('Please enter description', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showMessage('Please enter valid amount', 'error');
        return;
    }
    
    if (!paidBy) {
        showMessage('Please select who paid', 'error');
        return;
    }
    
    if (splitBetween.length === 0) {
        showMessage('Please select at least one member to split with', 'error');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showMessage('Please login first', 'error');
        return;
    }
    
    // Get group info
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const group = groups.find(g => g.id === groupId);
    
    if (!group) {
        showMessage('Group not found', 'error');
        return;
    }
    
    // Calculate per person share
    const perPersonShare = (amount / splitBetween.length).toFixed(2);
    
    // Create split object
    const newSplit = {
        id: Date.now(),
        groupId: groupId,
        groupName: group.name,
        description: description,
        totalAmount: amount,
        paidBy: paidBy,
        splitBetween: splitBetween,
        perPersonShare: parseFloat(perPersonShare),
        createdBy: currentUser.email,
        createdAt: new Date().toISOString()
    };
    
    // Save split
    let splits = JSON.parse(localStorage.getItem('splits')) || [];
    splits.push(newSplit);
    localStorage.setItem('splits', JSON.stringify(splits));
    
    showMessage(`✅ Split created! Each person owes ₹${perPersonShare}`, 'success');
    
    // Clear form
    document.getElementById('splitDescription').value = '';
    document.getElementById('splitAmount').value = '';
    document.getElementById('paidBy').value = '';
    document.querySelectorAll('#memberCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Show splits history
    loadSplitsHistory();
}

// Load splits history
function loadSplitsHistory() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const splits = JSON.parse(localStorage.getItem('splits')) || [];
    
    // Filter splits where user is involved
    const userSplits = splits.filter(s => 
        s.paidBy === currentUser.email || s.splitBetween.includes(currentUser.email)
    );
    
    const historyDiv = document.getElementById('splitsHistory');
    if (!historyDiv) return;
    
    if (userSplits.length === 0) {
        historyDiv.innerHTML = '<p style="color: #999; text-align: center;">No splits yet</p>';
        return;
    }
    
    historyDiv.innerHTML = userSplits.reverse().slice(0, 10).map(s => {
        const isPaidByMe = s.paidBy === currentUser.email;
        const iOwe = !isPaidByMe && s.splitBetween.includes(currentUser.email);
        
        return `
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h4 style="color: #667eea; margin-bottom: 5px;">${s.description}</h4>
                        <p style="color: #666; font-size: 14px;">Group: ${s.groupName}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: bold; color: #333;">₹${s.totalAmount}</div>
                        <div style="font-size: 12px; color: #999;">${new Date(s.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 10px;">
                    <div style="font-size: 13px; color: #555; margin-bottom: 8px;">
                        <strong>Paid by:</strong> ${s.paidBy}
                    </div>
                    <div style="font-size: 13px; color: #555; margin-bottom: 8px;">
                        <strong>Split between:</strong> ${s.splitBetween.join(', ')}
                    </div>
                    <div style="font-size: 14px; font-weight: bold; color: ${isPaidByMe ? '#27ae60' : '#e74c3c'}; margin-top: 10px;">
                        ${isPaidByMe 
                            ? `✅ You get back: ₹${(s.totalAmount - s.perPersonShare).toFixed(2)}` 
                            : iOwe 
                                ? `⚠️ You owe: ₹${s.perPersonShare}` 
                                : 'Not involved in payment'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load group dropdown for splits
function loadGroupDropdownForSplits() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const userGroups = groups.filter(g => 
        g.members.some(m => m.email === currentUser.email)
    );

    const select = document.getElementById('splitGroup');
    if (!select) return;
    
    if (userGroups.length === 0) {
        select.innerHTML = '<option value="">No groups available - Create one first!</option>';
    } else {
        select.innerHTML = '<option value="">Choose a group...</option>' +
            userGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }
}

// ============ AI CHAT WITH NATURAL LANGUAGE UNDERSTANDING ============

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const msg = input.value.trim();
    
    if (!msg) {
        showMessage('Please type a message', 'error');
        return;
    }

    addMessage('user', msg);
    input.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-msg';
    loadingDiv.className = 'chat-message ai-msg';
    loadingDiv.textContent = '🤔 Thinking...';
    
    const msgs = document.getElementById('chatMessages');
    msgs.appendChild(loadingDiv);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
        const loading = document.getElementById('loading-msg');
        if (loading) loading.remove();
        
        const reply = getAIReply(msg);
        addMessage('ai', reply);
    }, 1000);
}

function getAIReply(msg) {
    const lower = msg.toLowerCase();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        return 'Please login first to use this feature.';
    }
    
    // ========== DETECT "CREATE SPLIT" INTENT ==========
    const splitKeywords = ['split', 'divide', 'share'];
    const hasSplitIntent = splitKeywords.some(keyword => lower.includes(keyword));
    
    if (hasSplitIntent) {
        // Extract amount (e.g., 200, 500)
        const amountMatch = msg.match(/(\d+)\s*(rupees?|rs\.?|₹)?/i);
        
        // Extract person name (e.g., "lucky", "with raj")
        const withMatch = msg.match(/(?:with|between me and|and)\s+([a-z]+)/i);
        
        if (amountMatch && withMatch) {
            const amount = parseInt(amountMatch[1]);
            const personName = withMatch[1];
            const personEmail = `${personName.toLowerCase()}@gmail.com`;
            
            // Auto-create group with that person
            let groups = JSON.parse(localStorage.getItem('groups')) || [];
            
            // Check if group already exists
            let group = groups.find(g => 
                g.members.length === 2 && 
                g.members.some(m => m.email === personEmail) &&
                g.members.some(m => m.email === currentUser.email)
            );
            
            if (!group) {
                // Create new group
                group = {
                    id: Date.now(),
                    name: `${currentUser.email.split('@')[0]} & ${personName}`,
                    description: 'Auto-created by AI',
                    createdBy: currentUser.email,
                    members: [
                        { email: currentUser.email, role: 'creator' },
                        { email: personEmail, role: 'member' }
                    ],
                    createdAt: new Date().toISOString()
                };
                
                groups.push(group);
                localStorage.setItem('groups', JSON.stringify(groups));
            }
            
            // Create split
            const perPerson = (amount / 2).toFixed(2);
            
            const newSplit = {
                id: Date.now(),
                groupId: group.id,
                groupName: group.name,
                description: `Expense split via AI`,
                totalAmount: amount,
                paidBy: currentUser.email,
                splitBetween: [currentUser.email, personEmail],
                perPersonShare: parseFloat(perPerson),
                createdBy: currentUser.email,
                createdAt: new Date().toISOString()
            };
            
            let splits = JSON.parse(localStorage.getItem('splits')) || [];
            splits.push(newSplit);
            localStorage.setItem('splits', JSON.stringify(splits));
            
            // Reload groups if on dashboard
            if (typeof loadGroups === 'function') {
                loadGroups();
            }
            
            return `✅ **Split Created Successfully!**\n\n📋 Group: ${group.name}\n💰 Total Amount: ₹${amount}\n\n👥 Split Between:\n  • You (${currentUser.email})\n  • ${personName} (${personEmail})\n\n💸 Each Person Pays: ₹${perPerson}\n\n${personName} owes you ₹${perPerson}`;
        } else {
            return 'I can help you create a split! Please tell me:\n• The amount\n• The person\'s name\n\nExample: "Create split between me and lucky for 200 rupees"';
        }
    }
    
    // ========== DETECT MATH CALCULATIONS ==========
    const numbers = msg.match(/\d+(\.\d+)?/g);
    if (numbers && (msg.includes('+') || msg.includes('-') || msg.includes('*') || msg.includes('/'))) {
        try {
            const mathPart = msg.match(/[\d\s+\-*/().]+/)?.[0];
            if (mathPart) {
                const result = eval(mathPart.trim());
                return `🧮 **Calculation:**\n\n${mathPart.trim()} = **${result}**`;
            }
        } catch (e) {
            return 'I can help with calculations! Try: "500 + 300"';
        }
    }
    
    // ========== GREETINGS ==========
    if (lower.match(/^(hi|hello|hey|namaste)$/)) {
        return `Hello ${currentUser.email.split('@')[0]}! 👋\n\nI can help you:\n• Create splits: "split 200 between me and lucky"\n• Calculate: "500 + 300"\n• Manage expenses\n\nWhat would you like to do?`;
    }
    
    // ========== VIEW BALANCE ==========
    if (lower.includes('balance') || lower.includes('owe') || lower.includes('debt')) {
        const splits = JSON.parse(localStorage.getItem('splits')) || [];
        const mySplits = splits.filter(s => 
            s.paidBy === currentUser.email || s.splitBetween.includes(currentUser.email)
        );
        
        if (mySplits.length === 0) {
            return 'You have no expenses yet!';
        }
        
        let totalOwedToMe = 0;
        let totalIOwe = 0;
        
        mySplits.forEach(s => {
            if (s.paidBy === currentUser.email) {
                totalOwedToMe += s.totalAmount - s.perPersonShare;
            } else if (s.splitBetween.includes(currentUser.email)) {
                totalIOwe += s.perPersonShare;
            }
        });
        
        return `💰 **Your Balance:**\n\n✅ People owe you: ₹${totalOwedToMe.toFixed(2)}\n⚠️ You owe: ₹${totalIOwe.toFixed(2)}\n\n📊 Net Balance: ₹${(totalOwedToMe - totalIOwe).toFixed(2)}`;
    }
    
    // ========== DEFAULT HELP ==========
    return `I can help you with:\n\n💸 **Create Split:**\n"Create split between me and [name] for [amount] rupees"\n\n🧮 **Calculate:**\n"500 + 300" or "1200 / 4"\n\n💰 **Check Balance:**\n"Show my balance"\n\nTry it now!`;
}

function addMessage(type, text) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;
    
    const welcome = msgs.querySelector('.welcome-msg');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `chat-message ${type}-msg`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

// ============ UTILITIES ============

function showMessage(text, type) {
    const msg = document.getElementById('message');
    if (!msg) {
        alert(text);
        return;
    }
    
    msg.textContent = text;
    msg.className = type;
    msg.style.display = 'block';
    
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
}

// ============ EVENT LISTENERS ============

document.addEventListener('DOMContentLoaded', function() {
    // Make sure inputs are enabled
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.disabled = false;
        input.readOnly = false;
        input.style.pointerEvents = 'auto';
    });
    
    // Enter key support
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doLogin();
        });
    }
    
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doRegister();
        });
    }
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});
