// Game State
let currentNodeIndex = 0; // Current node index (0-based)
let completedNodes = new Set(); // Set of completed node indices
let playerLevel = 1; // Current player level - CỐ ĐỊNH
let playerOrc = 3; // Current Orc currency - giảm xuống

// Configuration - Single progression line
const totalNodes = 60; // Tăng lên để có đủ nodes cho 15 levels (15 x 4 = 60)
const statTypes = ['atk', 'def', 'spd', 'heal'];
const statNames = ['ATK', 'DEF', 'SPD', 'HEAL'];

// Special skills configuration - thêm levels tới 15
const specialSkills = {
    1: { name: "Start-\ner", description: "Begin your journey", cost: 1 },
    2: { name: "Fight-\ner", description: "Basic combat skills", cost: 1 },
    3: { name: "Lucky\nDog", description: "Increase drop chance by 15%", cost: 2 },
    4: { name: "Swift-\nness", description: "Movement speed +10%", cost: 2 },
    5: { name: "Tough-\nness", description: "HP +20%", cost: 2 },
    6: { name: "Ber-\nserker", description: "Damage +25% when HP < 50%", cost: 3 },
    7: { name: "Sharp-\nshooter", description: "Critical hit chance +15%", cost: 3 },
    8: { name: "Tank", description: "Armor +25%", cost: 3 },
    9: { name: "Regen-\nerator", description: "HP regen +5/sec", cost: 3 },
    10: { name: "Guard-\nian", description: "Reduce incoming damage by 20%", cost: 3 },
    11: { name: "Master", description: "All basic stats +10%", cost: 3 },
    12: { name: "Elite", description: "Experience gain +50%", cost: 3 },
    13: { name: "Champ-\nion", description: "Boss damage +30%", cost: 3 },
    14: { name: "Hero", description: "All resistances +25%", cost: 3 },
    15: { name: "Legend-\nary", description: "All stats +15%", cost: 3 }
};

// Initialize talent tree
function initializeTalentTree() {
    const container = document.getElementById('talentContent');
    container.innerHTML = '';
    
    // Create progress background
    const progressBg = document.createElement('div');
    progressBg.className = 'progress-background';
    progressBg.id = 'progressBackground';
    container.appendChild(progressBg);
    
    // Create nodes from bottom to top
    for (let nodeIndex = totalNodes - 1; nodeIndex >= 0; nodeIndex--) {
        createNodeBlock(nodeIndex);
    }
    
    updateAllStates();
}

// Create a single node block
function createNodeBlock(nodeIndex) {
    const container = document.getElementById('talentContent');
    const levelBlock = document.createElement('div');
    levelBlock.className = 'level-block';
    levelBlock.id = `node-${nodeIndex}`;

    // Background glow effect
    const levelGlow = document.createElement('div');
    levelGlow.className = 'level-glow';
    levelGlow.id = `glow-${nodeIndex}`;
    levelBlock.appendChild(levelGlow);

    // Normal Stat Node (Left-Center)
    const statType = statTypes[nodeIndex % 4];
    const statName = statNames[nodeIndex % 4];
    const normalStat = document.createElement('div');
    normalStat.className = `normal-stat ${statType}`;
    normalStat.textContent = statName;
    normalStat.dataset.nodeIndex = nodeIndex;
    normalStat.dataset.cost = 50 + Math.floor(nodeIndex / 4) * 10;
    normalStat.style.position = 'relative';
    normalStat.style.zIndex = '10';
    
    normalStat.addEventListener('mouseenter', showStatTooltip);
    normalStat.addEventListener('mouseleave', hideTooltip);
    normalStat.addEventListener('click', () => upgradeNormalNode(nodeIndex));
    
    levelBlock.appendChild(normalStat);

    // Calculate player level for this node (4 nodes = 1 level)
    const nodeLevel = Math.floor(nodeIndex / 4) + 1;

    // Level Display (Center) - chỉ hiển thị ở node cuối của mỗi level (node 3, 7, 11, 15, 19...)
    if (nodeIndex % 4 === 3) {
        const levelDisplay = document.createElement('div');
        levelDisplay.className = 'level-display';
        levelDisplay.textContent = nodeLevel;
        levelDisplay.dataset.level = nodeLevel;
        levelBlock.appendChild(levelDisplay);
    }

    // Special Skill (Right) - chỉ hiển thị ở node đầu của mỗi level có special skill (node 0, 4, 8, 12...)
    if (nodeIndex % 4 === 0 && specialSkills[nodeLevel]) {
        const specialSkill = document.createElement('div');
        specialSkill.className = 'special-skill';
        specialSkill.innerHTML = specialSkills[nodeLevel].name;
        specialSkill.dataset.level = nodeLevel;
        specialSkill.dataset.cost = specialSkills[nodeLevel].cost;
        
        specialSkill.addEventListener('mouseenter', showSpecialTooltip);
        specialSkill.addEventListener('mouseleave', hideTooltip);
        specialSkill.addEventListener('click', () => upgradeSpecial(nodeLevel));
        
        levelBlock.appendChild(specialSkill);
    }

    // Connection Line (except for last node)
    if (nodeIndex > 0) {
        const connectionLine = document.createElement('div');
        connectionLine.className = 'connection-line';
        connectionLine.id = `connection-${nodeIndex}`;
        levelBlock.appendChild(connectionLine);
    }

    container.appendChild(levelBlock);
}

// Update all visual states
function updateAllStates() {
    // Player level là CỐ ĐỊNH, không thay đổi theo node
    // playerLevel giữ nguyên giá trị hiện tại
    
    for (let nodeIndex = 0; nodeIndex < totalNodes; nodeIndex++) {
        updateNormalNodeState(nodeIndex);
        updateConnectionState(nodeIndex);
        updateLevelDisplayState(nodeIndex);
        updateBackgroundGlow(nodeIndex);
    }
    
    // Update progress background
    updateProgressBackground();
    
    // Update special skills based on player level
    Object.keys(specialSkills).forEach(level => {
        updateSpecialState(parseInt(level));
    });
    
    updateControlPanel();
}

// Update normal node state
function updateNormalNodeState(nodeIndex) {
    const normalNode = document.querySelector(`[data-node-index="${nodeIndex}"]`);
    if (!normalNode) return;

    const statType = statTypes[nodeIndex % 4];
    const nodeLevel = Math.floor(nodeIndex / 4) + 1; // Level yêu cầu cho node này
    
    if (completedNodes.has(nodeIndex)) {
        // Completed node
        normalNode.className = `normal-stat ${statType} completed`;
    } else if (nodeIndex === currentNodeIndex && playerLevel >= nodeLevel) {
        // Current node (chỉ sáng khi đủ level)
        normalNode.className = `normal-stat ${statType} current`;
    } else {
        // Locked node (dimmed)
        normalNode.className = `normal-stat ${statType} locked`;
    }
}

// Update connection line state
function updateConnectionState(nodeIndex) {
    const connection = document.getElementById(`connection-${nodeIndex}`);
    if (!connection) return;

    if (completedNodes.has(nodeIndex)) {
        connection.className = 'connection-line active';
    } else {
        connection.className = 'connection-line inactive';
    }
}

// Update level display state
function updateLevelDisplayState(nodeIndex) {
    // Chỉ cập nhật level display cho node cuối của mỗi level (node 3, 7, 11, 15, 19...)
    if (nodeIndex % 4 !== 3) return;
    
    const nodeLevel = Math.floor(nodeIndex / 4) + 1;
    const levelDisplay = document.querySelector(`[data-level="${nodeLevel}"]`);
    if (!levelDisplay) return;

    if (nodeLevel < playerLevel) {
        levelDisplay.className = 'level-display completed';
    } else if (nodeLevel === playerLevel) {
        levelDisplay.className = 'level-display current';
    } else {
        levelDisplay.className = 'level-display locked';
    }
}

// Update background glow effect
function updateBackgroundGlow(nodeIndex) {
    const glow = document.getElementById(`glow-${nodeIndex}`);
    if (!glow) return;

    // Background chỉ sáng đến current level (level cố định)
    const nodeLevel = Math.floor(nodeIndex / 4) + 1;
    
    if (nodeLevel <= playerLevel) {
        if (nodeIndex === currentNodeIndex) {
            glow.classList.add('active');
        } else if (nodeLevel < playerLevel) {
            glow.classList.add('active');
        } else {
            glow.classList.remove('active');
        }
    } else {
        glow.classList.remove('active');
    }
}

// Update progress background
function updateProgressBackground() {
    const progressBg = document.getElementById('progressBackground');
    if (!progressBg) return;
    
    // Tính toán chiều cao dựa trên vị trí current node
    const totalHeight = 5000; // Chiều cao tổng của talent-content
    const nodeSpacing = 100; // Khoảng cách giữa các node (margin-bottom từ CSS)
    const nodeHeight = 80; // Chiều cao của mỗi level-block
    const paddingBottom = 20; // Padding bottom của talent-content
    
    // Nodes được tạo từ 59 (top của DOM) xuống 0 (bottom của DOM)
    // currentNodeIndex = 0 ở bottom, currentNodeIndex = 59 ở top
    // Background dâng từ bottom lên, nên cần tính vị trí từ bottom
    
    // Vị trí của current node từ đáy lên (bao gồm cả current node)
    const nodesFromBottom = currentNodeIndex + 1; // +1 để bao gồm current node
    const backgroundHeight = paddingBottom + (nodesFromBottom * (nodeHeight + nodeSpacing)) - (nodeSpacing / 2);
    
    // Background dâng lên đến giữa current node
    progressBg.style.height = `${Math.min(backgroundHeight, totalHeight)}px`;
}

// Update special skill state (independent of normal nodes)
function updateSpecialState(requiredLevel) {
    // Chỉ kiểm tra special skill ở node đầu của mỗi level
    const firstNodeOfLevel = (requiredLevel - 1) * 4; // Node 0, 4, 8, 12...
    const specialSkill = document.querySelector(`[data-level="${requiredLevel}"].special-skill`);
    if (!specialSkill) return;

    const skillCost = specialSkills[requiredLevel].cost;

    // Kiểm tra điều kiện để special skill available:
    // 1. Player level >= required level
    // 2. Có đủ Orc
    // 3. Đã hoàn thành node trước đó (nếu không phải node đầu tiên)
    let canUpgrade = playerLevel >= requiredLevel && playerOrc >= skillCost;
    
    // Nếu không phải node đầu tiên (node 0), kiểm tra node trước đó đã hoàn thành chưa
    if (firstNodeOfLevel > 0) {
        const previousNodeCompleted = completedNodes.has(firstNodeOfLevel - 1);
        canUpgrade = canUpgrade && previousNodeCompleted;
    }

    if (canUpgrade) {
        specialSkill.classList.remove('locked');
        specialSkill.classList.add('available');
    } else {
        specialSkill.classList.add('locked');
        specialSkill.classList.remove('available');
    }
}

// Update control panel
function updateControlPanel() {
    const progressDisplay = document.getElementById('progressDisplay');
    const upgradeBtn = document.getElementById('upgradeBtn');
    
    if (currentNodeIndex >= totalNodes) {
        progressDisplay.textContent = 'All Nodes Complete!';
        upgradeBtn.textContent = 'Maxed Out';
        upgradeBtn.disabled = true;
        return;
    }

    const statName = statNames[currentNodeIndex % 4];
    const nodeLevel = Math.floor(currentNodeIndex / 4) + 1;
    const positionInLevel = (currentNodeIndex % 4) + 1;
    
    // Hiển thị progress theo current node, không theo player level
    progressDisplay.textContent = `Player Level ${playerLevel} - Node ${currentNodeIndex + 1}: ${statName}`;
    
    const cost = 50 + Math.floor(currentNodeIndex / 4) * 10;
    upgradeBtn.textContent = `Upgrade ${statName} (${cost} Gold)`;
    upgradeBtn.disabled = false;
    upgradeBtn.onclick = upgradeCurrentNode;
}

// Upgrade current node
function upgradeCurrentNode() {
    if (currentNodeIndex >= totalNodes) return;

    completedNodes.add(currentNodeIndex);
    currentNodeIndex++;

    // KHÔNG tự động level up khi hoàn thành node cuối level
    // Level up chỉ được thực hiện qua nút Level Up

    const statName = statNames[(currentNodeIndex - 1) % 4];
    
    updateAllStates();
    
    // Auto scroll to current node
    setTimeout(() => scrollToCurrentNode(), 200);
}

// Upgrade normal node (click handler)
function upgradeNormalNode(nodeIndex) {
    const nodeLevel = Math.floor(nodeIndex / 4) + 1; // Level yêu cầu cho node này
    
    if (nodeIndex !== currentNodeIndex) {
        if (nodeIndex > currentNodeIndex) {
            alert(`This node is locked! Complete the previous nodes first.`);
        } else {
            alert('This node is already completed!');
        }
        return;
    }
    
    // Kiểm tra player level có đủ để nâng cấp node này không
    if (playerLevel < nodeLevel) {
        alert(`You need to reach Level ${nodeLevel} to upgrade this node! Current level: ${playerLevel}`);
        return;
    }
    
    upgradeCurrentNode();
}

// Upgrade special skill
function upgradeSpecial(requiredLevel) {
    const skill = specialSkills[requiredLevel];
    const firstNodeOfLevel = (requiredLevel - 1) * 4; // Node 0, 4, 8, 12...
    
    if (playerLevel < requiredLevel) {
        alert(`Reach Level ${requiredLevel} first to unlock this special skill!`);
        return;
    }
    
    if (playerOrc < skill.cost) {
        alert(`Not enough Orc! You need ${skill.cost} Orc but only have ${playerOrc}.`);
        return;
    }
    
    // Kiểm tra node trước đó đã hoàn thành chưa (nếu không phải node đầu tiên)
    if (firstNodeOfLevel > 0 && !completedNodes.has(firstNodeOfLevel - 1)) {
        alert(`Complete the previous node first before upgrading this special skill!`);
        return;
    }
    
    // Trừ tiền và học skill
    playerOrc -= skill.cost;
    document.getElementById('orc-amount').textContent = playerOrc;
    
    alert(`Learned special skill: ${skill.name.replace('\n', ' ')}! Cost: ${skill.cost} Orc`);
    
    // Cập nhật lại trạng thái tất cả special skills
    updateAllStates();
}

// Tooltip functions
function showStatTooltip(event) {
    const element = event.target;
    const nodeIndex = parseInt(element.dataset.nodeIndex);
    const cost = element.dataset.cost;
    const statName = statNames[nodeIndex % 4];
    const nodeLevel = Math.floor(nodeIndex / 4) + 1;
    
    const isCompleted = completedNodes.has(nodeIndex);
    const isCurrent = (nodeIndex === currentNodeIndex);
    const hasRequiredLevel = playerLevel >= nodeLevel;
    
    let status = 'Locked';
    if (isCompleted) {
        status = 'Completed';
    } else if (isCurrent && hasRequiredLevel) {
        status = 'Ready to Upgrade';
    } else if (isCurrent && !hasRequiredLevel) {
        status = `Need Level ${nodeLevel} (Current: ${playerLevel})`;
    } else if (nodeIndex > currentNodeIndex) {
        status = 'Complete previous nodes first';
    }
    
    const content = `
        <div class="tooltip-title">${statName} - Node ${nodeIndex + 1}</div>
        <div class="tooltip-stats">
            Required Level: ${nodeLevel}<br>
            Current Level: ${playerLevel}<br>
            Status: ${status}<br>
            Cost: ${cost} Gold<br>
            Effect: +${5 + Math.floor(nodeIndex / 4) * 2} ${statName}<br>
            ${isCurrent && hasRequiredLevel ? '<br><strong>Click to upgrade!</strong>' : ''}
        </div>
    `;

    showTooltip(event, content);
}

function showSpecialTooltip(event) {
    const level = parseInt(event.target.dataset.level);
    const skill = specialSkills[level];
    const firstNodeOfLevel = (level - 1) * 4; // Node 0, 4, 8, 12...
    const isLevelReached = playerLevel >= level;
    const hasEnoughOrc = playerOrc >= skill.cost;
    const previousNodeCompleted = firstNodeOfLevel === 0 || completedNodes.has(firstNodeOfLevel - 1);
    const isAvailable = isLevelReached && hasEnoughOrc && previousNodeCompleted;
    
    let status = 'Locked';
    if (!isLevelReached) {
        status = `Need Level ${level}`;
    } else if (!hasEnoughOrc) {
        status = `Need ${skill.cost} Orc (Have ${playerOrc})`;
    } else if (!previousNodeCompleted) {
        status = `Complete previous node first`;
    } else {
        status = 'Available';
    }
    
    const content = `
        <div class="tooltip-title">${skill.name.replace('\n', ' ')}</div>
        <div class="tooltip-stats">
            Required Level: ${level}<br>
            Current Level: ${playerLevel}<br>
            Cost: ${skill.cost} Orc<br>
            Your Orc: ${playerOrc}<br>
            Effect: ${skill.description}<br>
            Status: ${status}
        </div>
    `;

    showTooltip(event, content);
}

function showTooltip(event, content) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
}

function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}

// Scroll functions
function scrollToNode(nodeIndex) {
    const nodeElement = document.getElementById(`node-${nodeIndex}`);
    if (nodeElement) {
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function scrollToCurrentNode() {
    if (currentNodeIndex < totalNodes) {
        scrollToNode(currentNodeIndex);
    }
}

// Reset progress
function resetProgress() {
    currentNodeIndex = 0;
    completedNodes.clear();
    playerLevel = 1; // Reset về level 1
    playerOrc = 3; // Reset Orc về giá trị ban đầu
    document.getElementById('orc-amount').textContent = playerOrc;
    updateAllStates();
    scrollToCurrentNode();
}

// Add Orc for testing
function addOrc() {
    playerOrc += 1; // Thay đổi từ +100 thành +1
    document.getElementById('orc-amount').textContent = playerOrc;
    updateAllStates(); // Cập nhật lại trạng thái special skills
}

// Level up function
function levelUp() {
    if (playerLevel < 15) {
        playerLevel += 1;
        updateAllStates();
    }
}

// Update current level indicator based on scroll position
function updateCurrentLevelIndicator() {
    const container = document.getElementById('talentContainer');
    const indicator = document.getElementById('currentLevelIndicator');
    if (!container || !indicator) return;

    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const scrollCenter = scrollTop + containerHeight / 2;

    // Calculate which level is currently in view
    const totalContentHeight = 5000;
    const levelHeight = totalContentHeight / 15; // 15 levels
    let currentViewLevel = Math.floor((totalContentHeight - scrollCenter) / levelHeight) + 1;
    
    // Clamp between 1 and 15
    currentViewLevel = Math.max(1, Math.min(15, currentViewLevel));
    
    // Update indicator
    indicator.textContent = currentViewLevel;
    
    // Update indicator style based on player progress
    indicator.className = 'current-level-indicator';
    if (currentViewLevel < playerLevel) {
        indicator.classList.add('completed');
    } else if (currentViewLevel > playerLevel) {
        indicator.classList.add('locked');
    }
    // Default style for current level (no additional class)
}

// Information Modal Functions
function showInfoModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'block';
    
    // Add event listener for clicking outside modal
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideInfoModal();
        }
    });
    
    // Add escape key listener
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideInfoModal();
        }
    });
}

function hideInfoModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'none';
    
    // Remove event listeners
    modal.removeEventListener('click', hideInfoModal);
    document.removeEventListener('keydown', hideInfoModal);
}

// Initialize on load
window.onload = function() {
    initializeTalentTree();
    
    // Add scroll listener for level indicator
    const talentContainer = document.getElementById('talentContainer');
    talentContainer.addEventListener('scroll', updateCurrentLevelIndicator);
    
    // Start at bottom (node 0)
    setTimeout(() => scrollToCurrentNode(), 500);
};
